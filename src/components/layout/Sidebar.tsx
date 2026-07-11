"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, QrCode,
  BarChart3, Settings, LogOut, Dumbbell, X, Menu, Sun, Moon, Package, Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Miembros", href: "/dashboard/members", icon: Users },
  { label: "Vencimientos", href: "/dashboard/members/expiring", icon: Bell },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
  { label: "Pagos", href: "/dashboard/payments", icon: DollarSign },
  { label: "Productos", href: "/dashboard/products", icon: Package },
  { label: "Acceso", href: "/dashboard/access", icon: QrCode, newTab: true },
  { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Configuración", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  gymName: string;
  userEmail: string;
  userRole: string;
  userName: string;
}

export function Sidebar({ gymName, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, toggle } = useTheme();
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
    <aside className="flex flex-col h-full w-60 bg-white dark:bg-[hsl(220,10%,18%)] border-r border-gray-100 dark:border-white/10">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ background: "#FF5A1F" }}>
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>NEXA<span style={{ color: "#FF5A1F" }}>GYM</span></p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">{gymName}</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noopener noreferrer" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2 border-t border-gray-100 dark:border-white/10 space-y-0.5">

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          <div className="flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-semibold shrink-0" style={{ background: "#FF5A1F" }}>
            {getInitials(userName)}
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{userName}</p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{loggingOut ? "Cerrando…" : "Cerrar sesión"}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden p-1.5 rounded-lg bg-white dark:bg-[hsl(220,10%,20%)] border border-gray-200 dark:border-white/10 shadow-sm text-gray-600 dark:text-gray-400"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Desktop */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
