"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type CreateUserState = {
  error?: string;
  success?: string;
};

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  const role = formData.get("role") as string;

  if (!email || !password || !firstName || !lastName || !role) {
    return { error: "Completá todos los campos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("gym_id, role")
    .eq("id", user.id)
    .single();

  if (!ownerProfile?.gym_id || ownerProfile.role !== "OWNER") {
    return { error: "Solo el dueño puede crear usuarios." };
  }

  const adminClient = createAdminClient();

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe un usuario con ese email." };
    }
    return { error: "No se pudo crear el usuario. Intentá de nuevo." };
  }

  await adminClient
    .from("profiles")
    .update({
      gym_id: ownerProfile.gym_id,
      role,
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", newUser.user!.id);

  return { success: `Usuario ${email} creado correctamente.` };
}
