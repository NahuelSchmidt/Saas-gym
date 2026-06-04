import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/database";

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
  className?: string;
}

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; className: string }
> = {
  EFECTIVO: {
    label: "Efectivo",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  TRANSFERENCIA: {
    label: "Transferencia",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  MERCADOPAGO: {
    label: "MercadoPago",
    className:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  },
  TARJETA: {
    label: "Tarjeta",
    className:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  },
};

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  const config = METHOD_CONFIG[method];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
