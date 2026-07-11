"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getGyms() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gyms")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface MemberRow {
  first_name: string;
  last_name: string;
  dni: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
}

export async function importMembers(gymId: string, members: MemberRow[]) {
  const supabase = createAdminClient();

  const today = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split("T")[0];

  const rows = members.map((m) => ({
    gym_id: gymId,
    first_name: m.first_name.trim(),
    last_name: m.last_name.trim(),
    dni: m.dni?.trim() || null,
    email: m.email?.trim() || null,
    phone: m.phone?.trim() || null,
    birth_date: m.birth_date || null,
    address: m.address?.trim() || null,
    notes: m.notes?.trim() || null,
    join_date: today,
    status: "ACTIVO" as const,
  }));

  const { data, error } = await supabase
    .from("members")
    .insert(rows)
    .select("id");

  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}
