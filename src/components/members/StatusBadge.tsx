import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/types/database";

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  MemberStatus,
  { label: string; variant: "success" | "secondary" | "destructive" }
> = {
  ACTIVO: { label: "Activo", variant: "success" },
  INACTIVO: { label: "Inactivo", variant: "secondary" },
  SUSPENDIDO: { label: "Suspendido", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVO;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
