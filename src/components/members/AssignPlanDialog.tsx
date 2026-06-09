"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { assignMembershipAction } from "@/app/dashboard/plans/actions";
import { createPaymentAction } from "@/app/dashboard/payments/actions";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

interface Props {
  memberId: string;
  plans: Plan[];
  currentEndDate?: string | null; // fecha de vencimiento de la membresía actual
}

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
];

export function AssignPlanDialog({ memberId, plans, currentEndDate }: Props) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  // Si hay membresía activa, sugerir arrancar al día siguiente del vencimiento
  const suggestedStart = currentEndDate
    ? (() => {
        const d = new Date(currentEndDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
      })()
    : new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(suggestedStart);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [amount, setAmount] = useState("");
  const [registerPayment, setRegisterPayment] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedPlan = plans.find((p) => p.id === planId);

  // Auto-fill amount when plan changes
  function handlePlanChange(id: string) {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    if (plan) setAmount(String(plan.price));
  }

  function getEndDate() {
    if (!selectedPlan || !startDate) return null;
    const end = new Date(startDate);
    end.setDate(end.getDate() + selectedPlan.duration_days - 1);
    return end.toISOString().split("T")[0];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId || !startDate) return;
    setError(null);

    startTransition(async () => {
      // 1. Create membership
      const msResult = await assignMembershipAction(memberId, planId, startDate);
      if (!msResult.success) {
        setError(msResult.error ?? "Error al asignar el plan.");
        return;
      }

      // 2. Register payment if checked
      if (registerPayment && msResult.data?.membershipId) {
        const endDate = getEndDate();
        const fd = new FormData();
        fd.set("member_id", memberId);
        fd.set("membership_id", String(msResult.data.membershipId));
        fd.set("amount", amount || String(selectedPlan?.price ?? 0));
        fd.set("payment_date", startDate);
        fd.set("payment_method", paymentMethod);
        fd.set("status", "PAGADO");
        if (startDate) fd.set("period_start", startDate);
        if (endDate) fd.set("period_end", endDate);

        const payResult = await createPaymentAction(
          { success: false },
          fd
        );
        if (!payResult.success) {
          setError(payResult.error ?? "Membresía creada pero error al registrar el pago.");
          return;
        }
      }

      setOpen(false);
      router.refresh();
    });
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setPlanId("");
      setAmount("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("EFECTIVO");
      setRegisterPayment(true);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CreditCard className="mr-2 h-4 w-4" />
          {currentEndDate ? "Renovar membresía" : "Asignar plan"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentEndDate ? "Renovar membresía" : "Asignar plan de membresía"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Plan */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan</label>
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccioná un plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.duration_days} días — ${p.price.toLocaleString("es-AR")}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <input
              type="date"
              lang="es-AR"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {selectedPlan && startDate && (
            <p className="text-sm text-muted-foreground">
              Vencimiento:{" "}
              <span className="font-medium text-foreground">{formatDate(getEndDate())}</span>
            </p>
          )}

          {/* Payment toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="register-payment"
              checked={registerPayment}
              onChange={(e) => setRegisterPayment(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="register-payment" className="text-sm font-medium">
              Registrar pago
            </label>
          </div>

          {registerPayment && (
            <div className="space-y-3 rounded-lg border border-input p-3">
              {/* Payment method */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        paymentMethod === m.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-input bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monto ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required={registerPayment}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !planId}>
              {isPending ? "Guardando…" : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
