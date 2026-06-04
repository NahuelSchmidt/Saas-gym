import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentAccess, type AccessLogEntry } from "@/components/dashboard/RecentAccess";
import { Users, DollarSign, UserX, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

const SPANISH_MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);

  const [
    { count: activeMembers },
    { data: todayPay },
    { data: monthPay },
    { data: prevPay },
    { count: expiredCount },
    { count: expiringSoon },
    { data: revenueRaw },
    { data: recentRaw },
  ] = await Promise.all([
    supabase.from("memberships").select("*, members!inner(deleted_at)", { count: "exact", head: true }).eq("status", "ACTIVO").is("members.deleted_at", null),
    supabase.from("payments").select("amount").eq("status", "PAGADO").gte("payment_date", todayStart.toISOString()),
    supabase.from("payments").select("amount").eq("status", "PAGADO").gte("payment_date", monthStart.toISOString()),
    supabase.from("payments").select("amount").eq("status", "PAGADO").gte("payment_date", prevMonthStart.toISOString()).lte("payment_date", prevMonthEnd.toISOString()),
    supabase.from("memberships").select("*, members!inner(deleted_at)", { count: "exact", head: true }).eq("status", "VENCIDO").is("members.deleted_at", null),
    supabase.from("memberships").select("*, members!inner(deleted_at)", { count: "exact", head: true }).eq("status", "ACTIVO").lte("end_date", in7Days.toISOString()).gte("end_date", now.toISOString()).is("members.deleted_at", null),
    supabase.from("payments").select("amount, payment_date").eq("status", "PAGADO").gte("payment_date", sixMonthsAgo.toISOString()).order("payment_date", { ascending: true }),
    supabase.from("access_logs").select("id, entry_time, access_granted, denial_reason, member_id, members(first_name, last_name)").order("entry_time", { ascending: false }).limit(10),
  ]);

  const todayRevenue = todayPay?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const monthRevenue = monthPay?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const prevMonthRevenue = prevPay?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const revenueTrend = prevMonthRevenue > 0
    ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null;

  // Build 6-month revenue chart data
  const revenueByMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueByMonth.set(`${d.getFullYear()}-${d.getMonth() + 1}`, 0);
  }
  revenueRaw?.forEach((p) => {
    if (!p.payment_date) return;
    const d = new Date(p.payment_date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + (p.amount ?? 0));
    }
  });
  const revenueChartData = Array.from(revenueByMonth.entries()).map(([key, total]) => ({
    month: SPANISH_MONTHS[parseInt(key.split("-")[1]) - 1],
    total,
  }));

  // Format recent access entries
  const recentAccess: AccessLogEntry[] = (recentRaw ?? []).map((log) => {
    const m = log.members as { first_name: string; last_name: string } | null;
    return {
      id: log.id,
      member_name: m ? `${m.first_name} ${m.last_name}` : "Miembro desconocido",
      entry_time: log.entry_time,
      access_granted: log.access_granted,
      denial_reason: log.denial_reason,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general de tu gimnasio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Miembros Activos"
          value={String(activeMembers ?? 0)}
          subtitle="membresías vigentes"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Ingresos del Día"
          value={formatCurrency(todayRevenue)}
          subtitle="pagos de hoy"
          icon={DollarSign}
          colorScheme="green"
        />
        <StatCard
          title="Ingresos del Mes"
          value={formatCurrency(monthRevenue)}
          subtitle="pagos este mes"
          icon={DollarSign}
          colorScheme="violet"
          trend={revenueTrend !== null ? {
            value: Math.abs(revenueTrend),
            direction: revenueTrend >= 0 ? "up" : "down",
          } : undefined}
        />
        <StatCard
          title="Membresías Vencidas"
          value={String(expiredCount ?? 0)}
          subtitle={`${expiringSoon ?? 0} vencen en 7 días`}
          icon={UserX}
          colorScheme="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Ingresos mensuales</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Últimos 6 meses</p>
          <RevenueChart data={revenueChartData} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Próximos vencimientos</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Membresías que vencen en 7 días</p>
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <CalendarClock className="w-10 h-10 text-amber-400" />
            <p className="text-3xl font-bold text-gray-900">{expiringSoon ?? 0}</p>
            <p className="text-sm text-gray-500">membresías por vencer</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Últimos accesos</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">Últimas 10 entradas registradas</p>
        <RecentAccess logs={recentAccess} />
      </div>
    </div>
  );
}
