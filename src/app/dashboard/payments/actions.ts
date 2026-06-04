"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PaymentInsert, PaymentUpdate, PaymentStatus } from "@/types/database";

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

export interface ActionState {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

// ── createPaymentAction ───────────────────────────────────────────────────────
// Inserts a new payment. If status = PAGADO and a matching membership exists,
// it updates the membership status to ACTIVO.

export async function createPaymentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    const member_id = formData.get("member_id") as string;
    const membership_id = (formData.get("membership_id") as string) || null;
    const amountRaw = formData.get("amount") as string;
    const amount = parseFloat(amountRaw);
    const payment_date = formData.get("payment_date") as string;
    const payment_method = formData.get("payment_method") as PaymentInsert["payment_method"];
    const period_start = (formData.get("period_start") as string) || null;
    const period_end = (formData.get("period_end") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const status = (formData.get("status") as PaymentStatus) ?? "PAGADO";

    // Validation
    if (!member_id) return { success: false, error: "Seleccioná un miembro." };
    if (isNaN(amount) || amount < 0) return { success: false, error: "El monto debe ser un número válido." };
    if (!payment_date) return { success: false, error: "La fecha de pago es obligatoria." };
    if (!payment_method) return { success: false, error: "Seleccioná un método de pago." };

    const payload: PaymentInsert = {
      gym_id: gymId,
      member_id,
      membership_id,
      amount,
      payment_date,
      payment_method,
      period_start,
      period_end,
      status,
      notes,
      receipt_url: null,
      mp_payment_id: null,
    };

    const { data: payment, error } = await supabase
      .from("payments")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // If the payment is confirmed and linked to a membership, activate it
    if (status === "PAGADO" && membership_id) {
      await supabase
        .from("memberships")
        .update({ status: "ACTIVO" } satisfies Partial<PaymentUpdate>)
        .eq("id", membership_id)
        .eq("gym_id", gymId);
    }

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard");

    return { success: true, data: { paymentId: payment.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar el pago.";
    return { success: false, error: message };
  }
}

// ── updatePaymentStatusAction ─────────────────────────────────────────────────

export async function updatePaymentStatusAction(
  paymentId: string,
  newStatus: PaymentStatus
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    // Fetch the payment to get the membership_id
    const { data: existing, error: fetchError } = await supabase
      .from("payments")
      .select("id, membership_id, status")
      .eq("id", paymentId)
      .eq("gym_id", gymId)
      .single();

    if (fetchError || !existing) throw new Error("No se encontró el pago.");

    const { error } = await supabase
      .from("payments")
      .update({ status: newStatus } satisfies Partial<PaymentUpdate>)
      .eq("id", paymentId)
      .eq("gym_id", gymId);

    if (error) throw new Error(error.message);

    // Sync membership status when transitioning to/from PAGADO
    if (existing.membership_id) {
      if (newStatus === "PAGADO") {
        await supabase
          .from("memberships")
          .update({ status: "ACTIVO" })
          .eq("id", existing.membership_id)
          .eq("gym_id", gymId);
      } else if (existing.status === "PAGADO" && newStatus !== "PAGADO") {
        // Payment was reverted from PAGADO — mark membership as VENCIDO
        await supabase
          .from("memberships")
          .update({ status: "VENCIDO" })
          .eq("id", existing.membership_id)
          .eq("gym_id", gymId);
      }
    }

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar el estado del pago.";
    return { success: false, error: message };
  }
}

// ── generateReceiptAction ─────────────────────────────────────────────────────
// Stub — returns a signed URL for a PDF receipt.
// Production implementation would use jsPDF or a dedicated service.

export async function generateReceiptAction(
  paymentId: string
): Promise<ActionState> {
  try {
    const { supabase, gymId } = await getAuthContext();

    // Verify the payment belongs to this gym
    const { data: payment, error } = await supabase
      .from("payments")
      .select(
        "id, amount, payment_date, payment_method, status, receipt_url, member_id, members(first_name, last_name)"
      )
      .eq("id", paymentId)
      .eq("gym_id", gymId)
      .single();

    if (error || !payment) throw new Error("No se encontró el pago.");

    // If a receipt_url is already stored, return it directly.
    if (payment.receipt_url) {
      return { success: true, data: { url: payment.receipt_url } };
    }

    // TODO: Generate PDF with jsPDF, upload to Supabase Storage, update receipt_url.
    // Stub: return a placeholder URL.
    const stubUrl = `/api/receipts/${paymentId}`;

    return { success: true, data: { url: stubUrl } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar el recibo.";
    return { success: false, error: message };
  }
}
