"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
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
  if (!log.exit_time) {
    return (
      <Badge variant="warning" className="gap-1 whitespace-nowrap">
        <Clock className="w-3 h-3" />
        En gimnasio
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1 whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" />
      Salida registrada
    </Badge>
  );
}

// ── TodayLog ──────────────────────────────────────────────────────────────────

export function TodayLog({ logs }: TodayLogProps) {
  const router = useRouter();

  const granted = logs.filter((l) => l.access_granted).length;
  const denied = logs.filter((l) => !l.access_granted).length;
  const inside = logs.filter((l) => l.access_granted && !l.exit_time).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Ingresos de hoy</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.refresh()}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
            "text-gray-600 bg-gray-50 border border-gray-200",
            "hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/60">
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total registros</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{granted}</p>
          <p className="text-xs text-gray-500 mt-0.5">Accesos permitidos</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{inside}</p>
          <p className="text-xs text-gray-500 mt-0.5">En el gimnasio</p>
        </div>
        <div className="flex-1 px-6 py-3 text-center">
          <p className="text-2xl font-bold text-red-500">{denied}</p>
          <p className="text-xs text-gray-500 mt-0.5">Denegados</p>
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
            <TableRow className="bg-gray-50/40">
              <TableHead className="pl-6">Miembro</TableHead>
              <TableHead>Hora entrada</TableHead>
              <TableHead>Hora salida</TableHead>
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
                      <p className="text-sm font-medium text-gray-900 truncate">
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
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {formatTime(log.entry_time)}
                  </span>
                </TableCell>

                {/* Exit time */}
                <TableCell>
                  {log.exit_time ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatTime(log.exit_time)}
                    </span>
                  ) : log.access_granted ? (
                    <span className="text-sm text-amber-500 font-medium">—</span>
                  ) : (
                    <span className="text-sm text-gray-300">—</span>
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
