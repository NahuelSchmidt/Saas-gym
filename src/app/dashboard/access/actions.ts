"use server";

import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemberSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  photo_url: string | null;
  status: string;
}

export interface AccessGranted {
  granted: true;
  memberName: string;
  planName: string;
  endDate: string;
  logId: string;
}

export interface AccessDenied {
  granted: false;
  memberName: string;
  reason: string;
  logId?: string;
}

export type AccessResult = AccessGranted | AccessDenied;

// ── denyUnknownAction ─────────────────────────────────────────────────────────

export async function denyUnknownAction(query: string): Promise<AccessResult> {
  return { granted: false, memberName: `"${query}"`, reason: "DNI o nombre no encontrado en el sistema" };
}

// ── searchMembersAction ───────────────────────────────────────────────────────

export async function searchMembersAction(query: string): Promise<MemberSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();

  // Get the current user's gym_id first
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_id) return [];

  const q = query.trim();

  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, dni, photo_url, status")
    .eq("gym_id", profile.gym_id)
    .is("deleted_at", null)
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,dni.ilike.%${q}%`)
    .order("first_name", { ascending: true })
    .limit(8);

  if (error) {
    console.error("[searchMembersAction]", error.message);
    return [];
  }

  return (data ?? []) as MemberSearchResult[];
}

// ── checkAccessAction ─────────────────────────────────────────────────────────

export async function checkAccessAction(memberId: string, branchId?: string | null): Promise<AccessResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { granted: false, memberName: "Desconocido", reason: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  const gymId = profile?.gym_id;
  if (!gymId) {
    return { granted: false, memberName: "Desconocido", reason: "Gimnasio no configurado" };
  }

  // 1. Get the member
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, first_name, last_name, status")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (memberError || !member) {
    return { granted: false, memberName: "Desconocido", reason: "Miembro no encontrado" };
  }

  const memberName = `${member.first_name} ${member.last_name}`;

  if (member.status !== "ACTIVO") {
    const statusMap: Record<string, string> = {
      INACTIVO: "El miembro está inactivo",
      SUSPENDIDO: "El miembro está suspendido",
    };
    const reason = statusMap[member.status] ?? `Estado: ${member.status}`;

    await supabase.from("access_logs").insert({
      gym_id: gymId,
      member_id: memberId,
      branch_id: branchId ?? null,
      entry_time: new Date().toISOString(),
      access_granted: false,
      denial_reason: reason,
    });

    return { granted: false, memberName, reason };
  }

  // 2. Get active membership with plan
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: membership, error: msError } = await supabase
    .from("memberships")
    .select("id, end_date, status, plans(id, name, access_days)")
    .eq("member_id", memberId)
    .eq("gym_id", gymId)
    .eq("status", "ACTIVO")
    .gte("end_date", today)
    .order("end_date", { ascending: false })
    .limit(1)
    .single();

  if (msError || !membership) {
    const reason = "Sin membresía activa";
    await supabase.from("access_logs").insert({
      gym_id: gymId,
      member_id: memberId,
      branch_id: branchId ?? null,
      entry_time: new Date().toISOString(),
      access_granted: false,
      denial_reason: reason,
    });
    return { granted: false, memberName, reason };
  }

  // Supabase returns the joined row as a single object (not array) when using .single()
  const plan = membership.plans as { id: string; name: string; access_days: number[] | null } | null;
  const planName = plan?.name ?? "Plan desconocido";
  const endDate = membership.end_date;

  // 3. Check access_days restriction (may be stored as strings or numbers)
  if (plan?.access_days && (plan.access_days as unknown as unknown[]).length > 0) {
    const todayJs = new Date().getDay(); // 0=Sun...6=Sat
    const jsToName: Record<number, string> = {
      0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
      4: "thursday", 5: "friday", 6: "saturday",
    };
    const displayNames: Record<string, string> = {
      monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
      thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
    };
    const arr = plan.access_days as unknown as (string | number)[];
    const todayAllowed = arr.some((d) =>
      d === todayJs || d === jsToName[todayJs]
    );
    if (!todayAllowed) {
      const todayName = jsToName[todayJs];
      const allowed = arr.map((d) =>
        typeof d === "number" ? displayNames[jsToName[d]] : displayNames[d as string] ?? d
      ).join(", ");
      const reason = `El plan no permite acceso hoy (${displayNames[todayName]}). Días permitidos: ${allowed}`;
      await supabase.from("access_logs").insert({
        gym_id: gymId,
        member_id: memberId,
        entry_time: new Date().toISOString(),
        access_granted: false,
        denial_reason: reason,
      });
      return { granted: false, memberName, reason };
    }
  }

  // 4. Check the latest payment for this membership
  const { data: latestPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("membership_id", membership.id)
    .eq("gym_id", gymId)
    .order("payment_date", { ascending: false })
    .limit(1)
    .single();

  if (latestPayment && latestPayment.status === "VENCIDO") {
    const reason = "Pago vencido — regularizar antes de ingresar";
    await supabase.from("access_logs").insert({
      gym_id: gymId,
      member_id: memberId,
      branch_id: branchId ?? null,
      entry_time: new Date().toISOString(),
      access_granted: false,
      denial_reason: reason,
    });
    return { granted: false, memberName, reason };
  }

  // 5. All checks passed — insert access log
  const { data: newLog, error: insertError } = await supabase
    .from("access_logs")
    .insert({
      gym_id: gymId,
      member_id: memberId,
      branch_id: branchId ?? null,
      entry_time: new Date().toISOString(),
      access_granted: true,
      denial_reason: null,
    })
    .select("id")
    .single();

  if (insertError || !newLog) {
    console.error("[checkAccessAction] insert log error:", insertError?.message);
  }

  return {
    granted: true,
    memberName,
    planName,
    endDate,
    logId: newLog?.id ?? "",
  };
}
