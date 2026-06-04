import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPaymentForm } from "@/components/payments/NewPaymentForm";
import type { Member, Plan, Membership } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NewPaymentPage() {
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
  if (!profile?.gym_id) redirect("/auth/login");
  const gymId = profile.gym_id;

  // Fetch active members and active plans in parallel
  const [{ data: membersRaw }, { data: plansRaw }, { data: membershipsRaw }] =
    await Promise.all([
      supabase
        .from("members")
        .select("id, first_name, last_name, email, status")
        .eq("gym_id", gymId)
        .eq("status", "ACTIVO")
        .is("deleted_at", null)
        .order("first_name"),
      supabase
        .from("plans")
        .select("id, name, price, duration_days, is_active")
        .eq("gym_id", gymId)
        .eq("is_active", true)
        .order("price"),
      supabase
        .from("memberships")
        .select("id, member_id, plan_id, start_date, end_date, status")
        .eq("gym_id", gymId)
        .in("status", ["ACTIVO", "VENCIDO", "PAUSADO"])
        .order("created_at", { ascending: false }),
    ]);

  const members = (membersRaw as Pick<Member, "id" | "first_name" | "last_name" | "email" | "status">[] | null) ?? [];
  const plans = (plansRaw as Pick<Plan, "id" | "name" | "price" | "duration_days" | "is_active">[] | null) ?? [];
  const memberships = (membershipsRaw as Pick<Membership, "id" | "member_id" | "plan_id" | "start_date" | "end_date" | "status">[] | null) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar pago</h1>
        <p className="mt-1 text-sm text-gray-500">
          Completá los datos del cobro para registrarlo en el sistema.
        </p>
      </div>

      <NewPaymentForm members={members} plans={plans} memberships={memberships} />
    </div>
  );
}
