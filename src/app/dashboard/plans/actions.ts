"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlanInsert, PlanUpdate, MembershipInsert } from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_id) throw new Error("No se encontró el gimnasio del usuario.");

  return { supabase, gymId: profile.gym_id };
}

// ── Action result type ────────────────────────────────────────────────────────

export interface ActionState {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

// ── createPlanAction ──────────────────────────────────────────────────────────

export async function createPlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const price = parseFloat(formData.get("price") as string);
    const duration_days = parseInt(formData.get("duration_days") as string, 10);
    const is_active = formData.get("is_active") === "true";

    // access_days is sent as a JSON array string from the form
    const accessDaysRaw = formData.get("access_days") as string;
    let access_days: number[] | null = null;
    try {
      const parsed = JSON.parse(accessDaysRaw);
      access_days = Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      access_days = null;
    }

    // Validation
    if (!name?.trim()) return { success: false, error: "El nombre del plan es obligatorio." };
    if (isNaN(price) || price < 0) return { success: false, error: "El precio debe ser un número válido." };
    if (isNaN(duration_days) || duration_days <= 0)
      return { success: false, error: "La duración debe ser mayor a 0 días." };

    const payload: PlanInsert = {
      gym_id: gymId,
      name: name.trim(),
      description,
      price,
      duration_days,
      access_days,
      is_active,
    };

    const { error } = await supabase.from("plans").insert(payload);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/plans");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear el plan.";
    return { success: false, error: message };
  }
}

// ── updatePlanAction ──────────────────────────────────────────────────────────

export async function updatePlanAction(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const price = parseFloat(formData.get("price") as string);
    const duration_days = parseInt(formData.get("duration_days") as string, 10);
    const is_active = formData.get("is_active") === "true";

    const accessDaysRaw = formData.get("access_days") as string;
    let access_days: number[] | null = null;
    try {
      const parsed = JSON.parse(accessDaysRaw);
      access_days = Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      access_days = null;
    }

    if (!name?.trim()) return { success: false, error: "El nombre del plan es obligatorio." };
    if (isNaN(price) || price < 0) return { success: false, error: "El precio debe ser un número válido." };
    if (isNaN(duration_days) || duration_days <= 0)
      return { success: false, error: "La duración debe ser mayor a 0 días." };

    const payload: PlanUpdate = {
      name: name.trim(),
      description,
      price,
      duration_days,
      access_days,
      is_active,
    };

    const { error } = await supabase
      .from("plans")
      .update(payload)
      .eq("id", id)
      .eq("gym_id", gymId);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/plans");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar el plan.";
    return { success: false, error: message };
  }
}

// ── deletePlanAction ──────────────────────────────────────────────────────────
// Soft delete: marks is_active = false instead of physical deletion.

export async function deletePlanAction(id: string): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    const { error } = await supabase
      .from("plans")
      .update({ is_active: false })
      .eq("id", id)
      .eq("gym_id", gymId);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/plans");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al desactivar el plan.";
    return { success: false, error: message };
  }
}

// ── assignMembershipAction ────────────────────────────────────────────────────
// Creates a new membership for a member, computing end_date from plan.duration_days.

export async function assignMembershipAction(
  memberId: string,
  planId: string,
  startDate: string
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    // Fetch the plan to get duration_days
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, duration_days, is_active")
      .eq("id", planId)
      .eq("gym_id", gymId)
      .single();

    if (planError || !plan) throw new Error("No se encontró el plan seleccionado.");
    if (!plan.is_active) throw new Error("El plan seleccionado está inactivo.");

    // Calculate end_date: startDate + (duration_days - 1) days
    const start = new Date(startDate);
    if (isNaN(start.getTime())) throw new Error("La fecha de inicio no es válida.");

    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days - 1);

    const payload: MembershipInsert = {
      gym_id: gymId,
      member_id: memberId,
      plan_id: planId,
      start_date: startDate,
      end_date: end.toISOString().split("T")[0],
      status: "ACTIVO",
      paused_at: null,
      pause_days_used: 0,
      notes: null,
    };

    const { data: membership, error } = await supabase
      .from("memberships")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/payments");

    return { success: true, data: { membershipId: membership.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al asignar la membresía.";
    return { success: false, error: message };
  }
}
