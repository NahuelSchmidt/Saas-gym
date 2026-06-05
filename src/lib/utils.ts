import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, pattern = "dd/MM/yyyy") {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern, { locale: es });
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | null | undefined) {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function formatRelativeTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
