"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Users, CheckCircle2, XCircle, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, getInitials, formatDate } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TodayLogEntry {
  id: string;
  member_id: string;
  member_name: string;
  member_initials: string;
  entry_time: string;
  exit_time: string | null;
  access_granted: boolean;
  denial_reason: string | null;
  branch_name: string | null;
}

interface TodayLogProps {
  logs: TodayLogEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EntryStatusBadge({ log }: { log: TodayLogEntry }) {
  if (!log.access_granted) {
    return (
      <Badge variant="destructive" className="gap-1 whitespace-nowrap">
        <XCircle className="w-3 h-3" />
        Denegado
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1 whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" />
      Permitido
    </Badge>
  );
}

// ── TodayLog ──────────────────────────────────────────────────────────────────

export function TodayLog({ logs }: TodayLogProps) {
  const router = useRouter();

  const granted = logs.filter((l) => l.access_granted).length;
  const denied = logs.filter((l) => !l.access_granted).length;

  return (
    <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Ingresos de hoy</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.refresh()}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "text-gray-600 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 dark:border-white/10",
            "hover:bg-gray-100 dark:bg-white/10 hover:text-gray-900 dark:text-gray-100 active:scale-95 transition-all"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex divide-x divide-gray-100 dark:divide-white/10 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{logs.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total registros</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{granted}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Accesos permitidos</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-red-500">{denied}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Denegados</p>
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Clock className="w-10 h-10 opacity-40" />
          <p className="text-base font-medium">Sin registros por ahora</p>
          <p className="text-sm">Los accesos de hoy aparecerán aquí</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/40 dark:bg-white/5">
              <TableHead className="pl-6">Miembro</TableHead>
              <TableHead>Hora entrada</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="pr-6">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-blue-50/20">
                {/* Member */}
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0",
                        log.access_granted
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {getInitials(log.member_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {log.member_name}
                      </p>
                      {log.denial_reason && (
                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">
                          {log.denial_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Entry time */}
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {formatTime(log.entry_time)}
                  </span>
                </TableCell>

                {/* Branch */}
                <TableCell>
                  {log.branch_name ? (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {log.branch_name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="pr-6">
                  <EntryStatusBadge log={log} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
