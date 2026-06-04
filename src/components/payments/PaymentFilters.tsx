"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { PaymentStatus, PaymentMethod } from "@/types/database";

interface PaymentFiltersProps {
  currentStatus?: PaymentStatus;
  currentMethod?: PaymentMethod;
  currentFrom: string;
  currentTo: string;
}

export function PaymentFilters({
  currentStatus,
  currentMethod,
  currentFrom,
  currentTo,
}: PaymentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams();
      // Reset page when filters change
      const merged = {
        status: currentStatus,
        method: currentMethod,
        from: currentFrom,
        to: currentTo,
        ...updates,
      };
      Object.entries(merged).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, currentStatus, currentMethod, currentFrom, currentTo]
  );

  const hasActiveFilters = !!currentStatus || !!currentMethod;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <Select
        value={currentStatus ?? "all"}
        onValueChange={(v) => push({ status: v === "all" ? undefined : v, page: undefined })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="PAGADO">Pagado</SelectItem>
          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
          <SelectItem value="VENCIDO">Vencido</SelectItem>
          <SelectItem value="PARCIAL">Parcial</SelectItem>
        </SelectContent>
      </Select>

      {/* Method filter */}
      <Select
        value={currentMethod ?? "all"}
        onValueChange={(v) => push({ method: v === "all" ? undefined : v, page: undefined })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Método de pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los métodos</SelectItem>
          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
          <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
          <SelectItem value="TARJETA">Tarjeta</SelectItem>
        </SelectContent>
      </Select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={currentFrom}
          onChange={(e) => push({ from: e.target.value, page: undefined })}
          className="w-[145px]"
        />
        <span className="text-sm text-muted-foreground">—</span>
        <Input
          type="date"
          value={currentTo}
          onChange={(e) => push({ to: e.target.value, page: undefined })}
          className="w-[145px]"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            push({ status: undefined, method: undefined, page: undefined })
          }
          className="text-muted-foreground"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
