"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, QrCode,
  BarChart3, Settings, LogOut, Dumbbell, X, Menu, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Miembros", href: "/dashboard/members", icon: Users },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
  { label: "Pagos", href: "/dashboard/payments", icon: DollarSign },
  { label: "Control de Acceso", href: "/dashboard/access", icon: QrCode },
  { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  STAFF: "Personal",
  RECEPTIONIST: "Recepcionista",
};

interface SidebarProps {
  gymName: string;
  userEmail: string;
  userRole: string;
  userName: string;
}

export function Sidebar({ gymName, userEmail, userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const supabase = createClient();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const sidebarContent = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 leading-none">GymFlow</p>
          <p className="mt-0.5 text-xs text-gray-500 truncate">{gymName}</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
            <span className="inline-block mt-0.5 px-1.5 py-px text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 leading-none">
              {roleLabels[userRole] ?? userRole}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-600"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
