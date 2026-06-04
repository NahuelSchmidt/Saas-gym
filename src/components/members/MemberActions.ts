"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

type ActionResult = { error?: string };

function extractFormString(formData: FormData, key: string): string {
  const val = formData.get(key);
  return typeof val === "string" ? val.trim() : "";
}

function extractOptionalString(
  formData: FormData,
  key: string
): string | null {
  const val = extractFormString(formData, key);
  return val === "" ? null : val;
}

// ── createMemberAction ────────────────────────────────────────────────────────

export async function createMemberAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  // Get gym_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();
  if (!profile?.gym_id) return { error: "No se encontró el gimnasio" };

  const gym_id = profile.gym_id;

  // Extract fields
  const first_name = extractFormString(formData, "first_name");
  const last_name = extractFormString(formData, "last_name");
  const dni = extractOptionalString(formData, "dni");
  const birth_date = extractOptionalString(formData, "birth_date");
  const email = extractOptionalString(formData, "email");
  const phone = extractOptionalString(formData, "phone");
  const address = extractOptionalString(formData, "address");
  const emergency_contact_name = extractOptionalString(
    formData,
    "emergency_contact_name"
  );
  const emergency_contact_phone = extractOptionalString(
    formData,
    "emergency_contact_phone"
  );
  const notes = extractOptionalString(formData, "notes");

  if (!first_name || !last_name) {
    return { error: "El nombre y apellido son obligatorios" };
  }

  // Insert member first to get the ID
  const { data: member, error: insertError } = await supabase
    .from("members")
    .insert({
      gym_id,
      first_name,
      last_name,
      dni,
      birth_date,
      email,
      phone,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
      join_date: new Date().toISOString().split("T")[0],
      status: "ACTIVO",
    })
    .select("id, qr_code")
    .single();

  if (insertError || !member) {
    return { error: insertError?.message ?? "Error al crear el miembro" };
  }

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;
  let photo_url: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${gym_id}/${member.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(path, photoFile, { upsert: true, contentType: photoFile.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("member-photos")
        .getPublicUrl(path);
      photo_url = urlData.publicUrl;
    }
  }

  // Generate QR code image and upload to storage
  const qrValue = member.qr_code ?? member.id;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Convert data URL to Buffer
    const base64 = qrDataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const qrPath = `${gym_id}/qr-${member.id}.png`;
    const { error: qrUploadError } = await supabase.storage
      .from("member-photos")
      .upload(qrPath, buffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (!qrUploadError) {
      const { data: qrUrlData } = supabase.storage
        .from("member-photos")
        .getPublicUrl(qrPath);

      // Update member with photo_url and qr storage path
      await supabase
        .from("members")
        .update({
          ...(photo_url ? { photo_url } : {}),
          qr_code: qrUrlData.publicUrl,
        })
        .eq("id", member.id);
    } else if (photo_url) {
      await supabase.from("members").update({ photo_url }).eq("id", member.id);
    }
  } catch {
    // QR generation failure is non-fatal — still update photo if any
    if (photo_url) {
      await supabase.from("members").update({ photo_url }).eq("id", member.id);
    }
  }

  redirect(`/dashboard/members/${member.id}`);
}

// ── updateMemberAction ────────────────────────────────────────────────────────

export async function updateMemberAction(
  id: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();
  if (!profile?.gym_id) return { error: "No se encontró el gimnasio" };

  const gym_id = profile.gym_id;

  const first_name = extractFormString(formData, "first_name");
  const last_name = extractFormString(formData, "last_name");
  const dni = extractOptionalString(formData, "dni");
  const birth_date = extractOptionalString(formData, "birth_date");
  const email = extractOptionalString(formData, "email");
  const phone = extractOptionalString(formData, "phone");
  const address = extractOptionalString(formData, "address");
  const status = extractFormString(formData, "status") as
    | "ACTIVO"
    | "INACTIVO"
    | "SUSPENDIDO";
  const emergency_contact_name = extractOptionalString(
    formData,
    "emergency_contact_name"
  );
  const emergency_contact_phone = extractOptionalString(
    formData,
    "emergency_contact_phone"
  );
  const notes = extractOptionalString(formData, "notes");

  if (!first_name || !last_name) {
    return { error: "El nombre y apellido son obligatorios" };
  }

  // Handle photo upload
  let photo_url: string | undefined = undefined;
  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${gym_id}/${id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(path, photoFile, { upsert: true, contentType: photoFile.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("member-photos")
        .getPublicUrl(path);
      photo_url = urlData.publicUrl;
    }
  }

  const updatePayload = {
    first_name,
    last_name,
    dni,
    birth_date,
    email,
    phone,
    address,
    status,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    ...(photo_url ? { photo_url } : {}),
  };

  const { error: updateError } = await supabase
    .from("members")
    .update(updatePayload)
    .eq("id", id)
    .eq("gym_id", gym_id);

  if (updateError) {
    return { error: updateError.message };
  }

  redirect(`/dashboard/members/${id}`);
}

// ── deleteMemberAction ────────────────────────────────────────────────────────

export async function deleteMemberAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();
  if (!profile?.gym_id) return { error: "No se encontró el gimnasio" };

  const { error } = await supabase
    .from("members")
    .update({ deleted_at: new Date().toISOString(), status: "INACTIVO" })
    .eq("id", id)
    .eq("gym_id", profile.gym_id);

  if (error) return { error: error.message };

  redirect("/dashboard/members");
}
