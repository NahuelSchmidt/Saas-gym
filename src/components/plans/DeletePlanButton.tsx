"use client";

import React, { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deletePlanAction } from "@/app/dashboard/plans/actions";

interface DeletePlanButtonProps {
  planId: string;
  planName: string;
  isActive: boolean;
}

export function DeletePlanButton({ planId, planName, isActive }: DeletePlanButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isActive) return null;

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlanAction(planId);
      if (result.success) {
        toast.success(`El plan "${planName}" fue desactivado.`);
        setOpen(false);
      } else {
        toast.error(result.error ?? "Error al desactivar el plan.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Desactivar plan</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de que querés desactivar el plan{" "}
          <span className="font-semibold text-foreground">&quot;{planName}&quot;</span>? Los
          miembros con membresías activas no se verán afectados, pero no se podrán asignar
          nuevas membresías con este plan.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
