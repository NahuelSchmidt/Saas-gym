"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePaymentStatusAction } from "@/app/dashboard/payments/actions";
import type { PaymentStatus } from "@/types/database";

interface PaymentStatusUpdaterProps {
  paymentId: string;
  currentStatus: PaymentStatus;
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  VENCIDO: "Vencido",
  PARCIAL: "Parcial",
};

export function PaymentStatusUpdater({
  paymentId,
  currentStatus,
}: PaymentStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const newStatus = value as PaymentStatus;
    startTransition(async () => {
      const result = await updatePaymentStatusAction(paymentId, newStatus);
      if (result.success) {
        toast.success(`Estado actualizado a "${STATUS_LABELS[newStatus]}".`);
      } else {
        toast.error(result.error ?? "Error al actualizar el estado.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="PAGADO">Pagado</SelectItem>
          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
          <SelectItem value="VENCIDO">Vencido</SelectItem>
          <SelectItem value="PARCIAL">Parcial</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
