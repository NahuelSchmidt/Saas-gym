import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import {
  Dumbbell,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberPortalPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Validar formato UUID básico para evitar queries inválidas
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: member, error } = await supabase
    .from("members")
    .select(`
      id, first_name, last_name, status, photo_url,
      gyms(name),
      memberships(id, status, start_date, end_date, plans(name, price))
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !member) notFound();

  type MS = { id: string; status: string; start_date: string; end_date: string; plans: { name: string; price: number } | null };
  const memberships = (member.memberships ?? []) as MS[];
  const activeMembership = memberships
    .filter((m) => m.status === "ACTIVO")
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  const lastExpired = !activeMembership
    ? memberships
        .filter((m) => m.status === "VENCIDO")
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
    : null;

  // Asistencias de este mes
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: attendanceCount } = await supabase
    .from("access_logs")
    .select("*", { count: "exact", head: true })
    .eq("member_id", id)
    .eq("access_granted", true)
    .gte("entry_time", monthStart);

  const gymName = (member.gyms as { name: string } | null)?.name ?? "GymFlow";
  const fullName = `${member.first_name} ${member.last_name}`;

  // Días restantes
  let daysLeft: number | null = null;
  if (activeMembership) {
    const today = new Date(new Date().toISOString().split("T")[0]);
    const end = new Date(activeMembership.end_date);
    daysLeft = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 dark:from-[hsl(220,10%,12%)] dark:to-[hsl(220,10%,16%)] flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="flex flex-col items-center text-white mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-3">
          <Dumbbell className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-white/80">{gymName}</p>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-sm bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl shadow-xl overflow-hidden">
        {/* Perfil */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-gray-100 dark:border-white/10">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3 overflow-hidden">
            {member.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              getInitials(fullName)
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{fullName}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Mi membresía</p>
        </div>

        {/* Estado */}
        <div className="p-6 space-y-4">
          {activeMembership ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Activa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {activeMembership.plans?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Vencimiento</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(activeMembership.end_date)}
                </span>
              </div>
              {daysLeft !== null && (
                <div className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                  daysLeft <= 3
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                }`}>
                  {daysLeft === 0 ? "Tu membresía vence hoy" : daysLeft === 1 ? "Tu membresía vence mañana" : `Quedan ${daysLeft} días`}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-red-500">
                  <XCircle className="w-4 h-4" />
                  Sin membresía activa
                </span>
              </div>
              {lastExpired && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Última membresía</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {lastExpired.plans?.name ?? "—"} · venció {formatDate(lastExpired.end_date)}
                  </span>
                </div>
              )}
              <div className="rounded-lg px-3 py-2 text-center text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Acercate a recepción para renovar
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-white/10 border-t border-gray-100 dark:border-white/10">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs">Asistencias</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{attendanceCount ?? 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">este mes</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-xs">Próx. pago</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {activeMembership?.plans?.price ? formatCurrency(activeMembership.plans.price) : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {activeMembership ? formatDate(activeMembership.end_date) : "—"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-white/60">
        <Calendar className="w-3.5 h-3.5" />
        Actualizado al momento
      </p>
    </div>
  );
}
