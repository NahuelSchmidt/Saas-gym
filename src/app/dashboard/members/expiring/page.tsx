import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell, ChevronLeft, Phone, MessageCircle } from "lucide-react";
import { ExpiringWhatsAppButton } from "./ExpiringWhatsAppButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function ExpiringMembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = Math.min(Math.max(parseInt(params.days ?? "7", 10), 1), 60);

  const supabase = await createClient();

  // Argentina UTC-3
  const now = new Date();
  const nowArg = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStr = nowArg.toISOString().split("T")[0];
  // Incluir también los que vencieron hasta 2 días atrás (por si no se avisó a tiempo)
  const fromDate = new Date(nowArg.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fromStr = fromDate.toISOString().split("T")[0];
  const futureDate = new Date(nowArg.getTime() + days * 24 * 60 * 60 * 1000);
  const futureStr = futureDate.toISOString().split("T")[0];

  const { data: memberships } = await supabase
    .from("memberships")
    .select(`
      id, end_date, status,
      plans(name),
      members!inner(id, first_name, last_name, phone, email, deleted_at)
    `)
    .in("status", ["ACTIVO", "VENCIDO"])
    .gte("end_date", fromStr)
    .lte("end_date", futureStr)
    .is("members.deleted_at", null)
    .order("end_date", { ascending: true });

  // Calcular días hasta vencimiento
  type MembershipRow = {
    id: string;
    end_date: string;
    status: string;
    plans: { name: string } | null;
    members: { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; deleted_at: string | null } | null;
    daysLeft: number;
  };

  const rows: MembershipRow[] = (memberships ?? []).map((m) => {
    const end = new Date(m.end_date);
    const diff = Math.round((end.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
    return { ...m, members: m.members as MembershipRow["members"], plans: m.plans as { name: string } | null, daysLeft: diff };
  });

  const FILTER_OPTIONS = [
    { label: "3 días", value: 3 },
    { label: "7 días", value: 7 },
    { label: "15 días", value: 15 },
    { label: "30 días", value: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/members"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Miembros
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Vencimientos próximos
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
            {rows.length} membresía{rows.length !== 1 ? "s" : ""} vencidas o por vencer en {days} días
          </p>
        </div>

        {/* Filtro de días */}
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/dashboard/members/expiring?days=${opt.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10 py-16 text-center">
          <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No hay vencimientos en los próximos {days} días
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {rows.map((row) => {
              const member = row.members;
              if (!member) return null;
              const fullName = `${member.first_name} ${member.last_name}`;
              const urgency =
                row.daysLeft < 0
                  ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20"
                  : row.daysLeft <= 1
                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
                  : row.daysLeft <= 3
                  ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                  : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10";

              return (
                <div
                  key={row.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Avatar inicial */}
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {fullName}
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      <span>{row.plans?.name ?? "Plan desconocido"}</span>
                      {member.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge días */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${urgency}`}>
                    {row.daysLeft < 0
                      ? `Venció hace ${Math.abs(row.daysLeft)} día${Math.abs(row.daysLeft) !== 1 ? "s" : ""}`
                      : row.daysLeft === 0
                      ? "Vence hoy"
                      : row.daysLeft === 1
                      ? "Vence mañana"
                      : `Vence en ${row.daysLeft} días`}
                  </span>

                  {/* Fecha */}
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block shrink-0 w-24 text-right">
                    {formatDate(row.end_date)}
                  </span>

                  {/* Botón WhatsApp */}
                  <ExpiringWhatsAppButton
                    memberName={member.first_name}
                    phone={member.phone}
                    daysLeft={row.daysLeft}
                    planName={row.plans?.name ?? "tu membresía"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info tip */}
      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" />
        El botón de WhatsApp abre la app con el mensaje ya escrito. Solo hace falta tocar enviar.
      </p>
    </div>
  );
}
