import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PlanDialog } from "@/components/plans/PlanDialog";
import { DeletePlanButton } from "@/components/plans/DeletePlanButton";
import { CalendarDays, Clock, Tag } from "lucide-react";
import type { Plan } from "@/types/database";

export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatAccessDays(days: number[] | null): string {
  if (!days || days.length === 7) return "Todos los días";
  const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  return sorted.map((d) => DAY_LABELS[d]).join(", ");
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PlansPage() {
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

  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("gym_id", profile.gym_id)
    .order("is_active", { ascending: false })
    .order("price", { ascending: true });

  if (error) {
    console.error("Error al obtener planes:", error.message);
  }

  const allPlans: Plan[] = plans ?? [];
  const activePlans = allPlans.filter((p) => p.is_active);
  const inactivePlans = allPlans.filter((p) => !p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {activePlans.length} plan{activePlans.length !== 1 ? "es" : ""} activo
            {activePlans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PlanDialog />
      </div>

      {/* Empty state */}
      {allPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <Tag className="mb-3 h-10 w-10 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-700">No hay planes creados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Creá tu primer plan para comenzar a asignar membresías.
          </p>
          <div className="mt-5">
            <PlanDialog />
          </div>
        </div>
      )}

      {/* Active plans grid */}
      {activePlans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Activos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Inactive plans grid */}
      {inactivePlans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Inactivos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 opacity-60">
            {inactivePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── PlanCard ───────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900">{plan.name}</h3>
            {plan.description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{plan.description}</p>
            )}
          </div>
          <Badge
            variant={plan.is_active ? "success" : "secondary"}
            className="shrink-0"
          >
            {plan.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Price — hero figure */}
        <div className="rounded-lg bg-primary/5 px-4 py-3 text-center">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(plan.price)}
          </span>
          <span className="ml-1 text-xs text-gray-500">ARS</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {plan.duration_days} día{plan.duration_days !== 1 ? "s" : ""} de duración
          </span>
        </div>

        {/* Access days */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>{formatAccessDays(plan.access_days)}</span>
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t pt-3">
        <PlanDialog plan={plan} />
        <DeletePlanButton planId={plan.id} planName={plan.name} isActive={plan.is_active} />
      </CardFooter>
    </Card>
  );
}
