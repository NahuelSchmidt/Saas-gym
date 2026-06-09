"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFormState as useActionState } from "react-dom";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { createPaymentAction, type ActionState } from "@/app/dashboard/payments/actions";
import type { Member, Plan, Membership } from "@/types/database";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  member_id: z.string().min(1, "Seleccioná un miembro"),
  membership_id: z.string().optional(),
  amount: z
    .number({ invalid_type_error: "Ingresá un monto válido" })
    .min(0, "El monto no puede ser negativo"),
  payment_date: z.string().min(1, "La fecha de pago es obligatoria"),
  payment_method: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["PAGADO", "PENDIENTE", "VENCIDO", "PARCIAL"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ── Props ──────────────────────────────────────────────────────────────────────

interface NewPaymentFormProps {
  members: Pick<Member, "id" | "first_name" | "last_name" | "email" | "status">[];
  plans: Pick<Plan, "id" | "name" | "price" | "duration_days" | "is_active">[];
  memberships: Pick<Membership, "id" | "member_id" | "plan_id" | "start_date" | "end_date" | "status">[];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function NewPaymentForm({ members, plans, memberships }: NewPaymentFormProps) {
  const router = useRouter();
  const [memberSearch, setMemberSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const initialState: ActionState = { success: false };
  const [state, formAction, isPending] = useActionState(createPaymentAction, initialState);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_id: "",
      membership_id: "",
      amount: 0,
      payment_date: today,
      payment_method: "EFECTIVO",
      period_start: "",
      period_end: "",
      notes: "",
      status: "PAGADO",
    },
  });

  const selectedMemberId = watch("member_id");
  const selectedMembershipId = watch("membership_id");

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      toast.success("Pago registrado correctamente.");
      router.push("/dashboard/payments");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  // Memberships for the selected member
  const memberMemberships = useMemo(
    () => memberships.filter((ms) => ms.member_id === selectedMemberId),
    [memberships, selectedMemberId]
  );

  // Auto-fill amount when a membership/plan is chosen
  useEffect(() => {
    if (!selectedMembershipId) return;
    const ms = memberships.find((m) => m.id === selectedMembershipId);
    if (!ms) return;
    const plan = plans.find((p) => p.id === ms.plan_id);
    if (plan) {
      setValue("amount", plan.price);
      // Auto-fill period
      setValue("period_start", ms.start_date);
      setValue("period_end", ms.end_date);
    }
  }, [selectedMembershipId, memberships, plans, setValue]);

  // Member search autocomplete
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8);
    const q = memberSearch.toLowerCase();
    return members
      .filter((m) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, memberSearch]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  function selectMember(member: (typeof members)[number]) {
    setValue("member_id", member.id, { shouldValidate: true });
    setValue("membership_id", "");
    setMemberSearch(`${member.first_name} ${member.last_name}`);
    setShowSuggestions(false);
  }

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("member_id", values.member_id);
    if (values.membership_id) fd.set("membership_id", values.membership_id);
    fd.set("amount", String(values.amount));
    fd.set("payment_date", values.payment_date);
    fd.set("payment_method", values.payment_method);
    if (values.period_start) fd.set("period_start", values.period_start);
    if (values.period_end) fd.set("period_end", values.period_end);
    if (values.notes) fd.set("notes", values.notes);
    fd.set("status", values.status);
    React.startTransition(() => formAction(fd));
  });

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="space-y-5 pt-6">
          {/* Member selector */}
          <div className="space-y-1.5">
            <Label>
              Miembro <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar miembro por nombre..."
                value={memberSearch}
                className="pl-9"
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value) {
                    setValue("member_id", "");
                    setValue("membership_id", "");
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && filteredMembers.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full rounded-md border bg-popover py-1 shadow-lg">
                  {filteredMembers.map((m) => (
                    <li
                      key={m.id}
                      onMouseDown={() => selectMember(m)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                    >
                      <span className="font-medium">
                        {m.first_name} {m.last_name}
                      </span>
                      {m.email && (
                        <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Hidden field for form validation */}
            <input type="hidden" {...register("member_id")} />
            {errors.member_id && (
              <p className="text-xs text-destructive">{errors.member_id.message}</p>
            )}
          </div>

          {/* Membership selector (only shows when a member is selected) */}
          {selectedMember && memberMemberships.length > 0 && (
            <div className="space-y-1.5">
              <Label>Membresía (opcional)</Label>
              <Controller
                control={control}
                name="membership_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a una membresía..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin vincular</SelectItem>
                      {memberMemberships.map((ms) => {
                        const plan = plans.find((p) => p.id === ms.plan_id);
                        return (
                          <SelectItem key={ms.id} value={ms.id}>
                            {plan?.name ?? "Plan desconocido"} —{" "}
                            <span className="text-muted-foreground">
                              {ms.start_date} al {ms.end_date}
                            </span>{" "}
                            ({ms.status})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Al vincular, el monto y período se completan automáticamente.
              </p>
            </div>
          )}

          {/* Amount + Method row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">
                Monto (ARS) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Método de pago <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="payment_method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Date + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">
                Fecha de pago <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pay-date"
                type="date"
                lang="es-AR"
                {...register("payment_date")}
              />
              {errors.payment_date && (
                <p className="text-xs text-destructive">{errors.payment_date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAGADO">Pagado</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="PARCIAL">Parcial</SelectItem>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-period-start">Período desde</Label>
              <Input
                id="pay-period-start"
                type="date"
                lang="es-AR"
                {...register("period_start")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-period-end">Período hasta</Label>
              <Input
                id="pay-period-end"
                type="date"
                lang="es-AR"
                {...register("period_end")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Notas</Label>
            <Textarea
              id="pay-notes"
              placeholder="Notas u observaciones sobre el pago..."
              rows={3}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/payments")}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar pago
        </Button>
      </div>
    </form>
  );
}
