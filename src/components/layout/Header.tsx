"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/members": "Miembros",
  "/dashboard/plans": "Planes",
  "/dashboard/payments": "Pagos",
  "/dashboard/access": "Control de Acceso",
  "/dashboard/reports": "Reportes",
  "/dashboard/settings": "Configuración",
};

interface HeaderProps {
  gymName: string;
  userEmail: string;
  userName: string;
  avatarUrl: string | null;
  notificationCount?: number;
}

export function Header({ userName, notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "GymFlow";

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[hsl(220,10%,18%)] border-b border-gray-200 dark:border-white/10 shrink-0">
      <div className="w-9" aria-hidden="true" />
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{pageTitle}</h1>
      <button
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/10"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold shrink-0">
        {getInitials(userName)}
      </div>
    </header>
  );
}
