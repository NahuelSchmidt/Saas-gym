"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: boolean;
  redirect?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// loginAction
// ─────────────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor completá todos los campos." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Email o contraseña incorrectos." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirmá tu email antes de iniciar sesión." };
    }
    return { error: "Ocurrió un error al iniciar sesión. Intentá de nuevo." };
  }

  return { success: true, redirect: "/dashboard" };
}

// ─────────────────────────────────────────────────────────────────────────────
// registerAction
// ─────────────────────────────────────────────────────────────────────────────

export async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const gymName = (formData.get("gym_name") as string)?.trim();

  // ── Validations ────────────────────────────────────────────────────────────
  if (!firstName || !lastName || !email || !password || !confirmPassword || !gymName) {
    return { error: "Por favor completá todos los campos." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();

  // ── 1. Create auth user ────────────────────────────────────────────────────
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        gym_name: gymName,
        role: "OWNER",
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: "Error inesperado al crear el usuario." };
  }

  // ── 2. Insert gym record (admin client bypasses RLS — user has no session yet) ──
  const adminClient = createAdminClient();

  const { data: gymData, error: gymError } = await adminClient
    .from("gyms")
    .insert({
      name: gymName,
      timezone: "America/Argentina/Buenos_Aires",
      currency: "ARS",
    })
    .select("id")
    .single();

  if (gymError || !gymData) {
    return { error: "No se pudo crear el gimnasio. Intentá de nuevo." };
  }

  // ── 3. Update profile with gym_id and role OWNER ───────────────────────────
  await adminClient
    .from("profiles")
    .update({
      gym_id: gymData.id,
      role: "OWNER",
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", userId);

  redirect("/dashboard");
}

// ─────────────────────────────────────────────────────────────────────────────
// logoutAction
// ─────────────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
