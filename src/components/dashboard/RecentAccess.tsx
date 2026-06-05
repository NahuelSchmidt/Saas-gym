import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getInitials, formatDateTime } from "@/lib/utils";

export interface AccessLogEntry {
  id: string;
  member_name: string;
  entry_time: string;
  access_granted: boolean;
  denial_reason: string | null;
}

interface RecentAccessProps {
  logs: AccessLogEntry[];
}

export function RecentAccess({ logs }: RecentAccessProps) {
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
        <Clock className="w-8 h-8" />
        <p className="text-sm">Sin registros de acceso recientes</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/10 dark:divide-white/10">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold shrink-0">
            {getInitials(log.member_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{log.member_name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(log.entry_time)}</p>
          </div>
          {log.access_granted ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Permitido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 shrink-0">
              <XCircle className="w-3.5 h-3.5" />
              Denegado
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
