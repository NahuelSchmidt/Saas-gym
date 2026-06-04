"use client";

import React, { useEffect } from "react";
import { useFormState as useActionState } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createPlanAction,
  updatePlanAction,
  type ActionState,
} from "@/app/dashboard/plans/actions";
import type { Plan } from "@/types/database";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(500).optional(),
  price: z
    .number({ invalid_type_error: "Ingresá un precio válido" })
    .min(0, "El precio no puede ser negativo"),
  duration_days: z
    .number({ invalid_type_error: "Ingresá una duración válida" })
    .int()
    .min(1, "La duración debe ser al menos 1 día"),
  access_days: z.array(z.number().int().min(0).max(6)),
  is_active: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

// ── Day labels ─────────────────────────────────────────────────────────────────
// access_days uses numeric indices: 0=Dom, 1=Lun, ..., 6=Sáb (matching JS Date.getDay())

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
] as const;

// ── Props ──────────────────────────────────────────────────────────────────────

interface PlanDialogProps {
  /** When provided, the dialog is in edit mode. */
  plan?: Plan;
  /** Optional custom trigger; defaults to a contextual button. */
  trigger?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PlanDialog({ plan, trigger }: PlanDialogProps) {
  const isEdit = !!plan;
  const [open, setOpen] = React.useState(false);

  // Bind the update action to the plan id when editing
  const boundAction = isEdit
    ? updatePlanAction.bind(null, plan.id)
    : createPlanAction;

  const initialState: ActionState = { success: false };
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      price: plan?.price ?? 0,
      duration_days: plan?.duration_days ?? 30,
      access_days: plan?.access_days ?? [1, 2, 3, 4, 5, 6, 0],
      is_active: plan?.is_active ?? true,
    },
  });

  // Close dialog and show toast on server action result
  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "Plan actualizado correctamente." : "Plan creado correctamente.");
      setOpen(false);
      reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, isEdit, reset]);

  // Reset form values when the dialog re-opens with a (possibly updated) plan
  useEffect(() => {
    if (open) {
      reset({
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        price: plan?.price ?? 0,
        duration_days: plan?.duration_days ?? 30,
        access_days: plan?.access_days ?? [1, 2, 3, 4, 5, 6, 0],
        is_active: plan?.is_active ?? true,
      });
    }
  }, [open, plan, reset]);

  // Bridge react-hook-form validation → server action via FormData
  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("description", values.description ?? "");
    fd.set("price", String(values.price));
    fd.set("duration_days", String(values.duration_days));
    fd.set("access_days", JSON.stringify(values.access_days));
    fd.set("is_active", String(values.is_active));
    React.startTransition(() => formAction(fd));
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size={isEdit ? "sm" : "default"} variant={isEdit ? "outline" : "default"}>
            {isEdit ? (
              <>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                Nuevo plan
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plan" : "Crear nuevo plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-name"
              placeholder="Ej.: Plan Mensual"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="plan-description">Descripción</Label>
            <Textarea
              id="plan-description"
              placeholder="Descripción breve del plan..."
              rows={2}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Price + Duration row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">
                Precio (ARS) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-duration">
                Duración (días) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-duration"
                type="number"
                min={1}
                step={1}
                placeholder="30"
                {...register("duration_days", { valueAsNumber: true })}
              />
              {errors.duration_days && (
                <p className="text-xs text-destructive">{errors.duration_days.message}</p>
              )}
            </div>
          </div>

          {/* Access days */}
          <div className="space-y-2">
            <Label>Días de acceso</Label>
            <Controller
              control={control}
              name="access_days"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const checked = field.value.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          field.onChange(
                            checked
                              ? field.value.filter((d) => d !== day.value)
                              : [...field.value, day.value]
                          );
                        }}
                        className={[
                          "h-9 w-12 rounded-md border text-xs font-semibold transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background text-foreground hover:bg-accent",
                        ].join(" ")}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Sin selección = acceso todos los días.
            </p>
          </div>

          {/* Active toggle */}
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={[
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    field.value ? "bg-primary" : "bg-input",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
                      field.value ? "translate-x-4" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
                <Label className="cursor-pointer" onClick={() => field.onChange(!field.value)}>
                  Plan activo
                </Label>
              </div>
            )}
          />

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
