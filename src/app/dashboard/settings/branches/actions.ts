"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BranchState = { error?: string; success?: string };

export async function createBranchAction(_prev: BranchState, formData: FormData): Promise<BranchState> {
  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase.from("profiles").select("gym_id").eq("id", user.id).single();
  if (!profile?.gym_id) return { error: "Gimnasio no encontrado." };

  const { error } = await supabase.from("branches").insert({ gym_id: profile.gym_id, name, address, phone });
  if (error) return { error: "No se pudo crear la sucursal." };

  revalidatePath("/dashboard/settings");
  return { success: `Sucursal "${name}" creada.` };
}

export async function deleteBranchAction(branchId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("branches").delete().eq("id", branchId);
  if (error) return { error: "No se pudo eliminar la sucursal." };
  revalidatePath("/dashboard/settings");
  return {};
}
