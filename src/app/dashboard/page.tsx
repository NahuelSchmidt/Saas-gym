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

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  const gymId = profile?.gym_id;
  if (!gymId) redirect("/auth/login");

  const now = new Date();
  // Argentina es UTC-3: ajustamos para calcular fechas correctamente en horario local
  const ARG_OFFSET_MS = -3 * 60 * 60 * 1000;
  const nowArg = new Date(now.getTime() + ARG_OFFSET_MS);
  const todayStr = nowArg.toISOString().split("T")[0]; // "YYYY-MM-DD" en hora Argentina
  const monthStr = `${nowArg.getUTCFullYear()}-${String(nowArg.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const prevMonthDate = new Date(Date.UTC(nowArg.getUTCFullYear(), nowArg.getUTCMonth() - 1, 1));
  const prevMonthStr = prevMonthDate.toISOString().split("T")[0];
  const prevMonthEndDate = new Date(Date.UTC(nowArg.getUTCFullYear(), nowArg.getUTCMonth(), 0));
  const prevMonthEndStr = prevMonthEndDate.toISOString().split("T")[0];
  const sixMonthsAgoDate = new Date(Date.UTC(nowArg.getUTCFullYear(), nowArg.getUTCMonth() - 5, 1));
  const sixMonthsAgoStr = sixMonthsAgoDate.toISOString().split("T")[0];
  const in7DaysDate = new Date(nowArg.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in7DaysStr = in7DaysDate.toISOString().split("T")[0];
  const tomorrowDate = new Date(nowArg.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
  const nowStr = todayStr;


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
    supabase.from("payments").select("amount").eq("gym_id", gymId).eq("status", "PAGADO").gte("payment_date", todayStr).lt("payment_date", tomorrowStr),
    supabase.from("payments").select("amount").eq("gym_id", gymId).eq("status", "PAGADO").gte("payment_date", monthStr).lte("payment_date", todayStr),
    supabase.from("payments").select("amount").eq("gym_id", gymId).eq("status", "PAGADO").gte("payment_date", prevMonthStr).lte("payment_date", prevMonthEndStr),
    supabase.from("memberships").select("*, members!inner(deleted_at)", { count: "exact", head: true }).eq("status", "VENCIDO").is("members.deleted_at", null),
    supabase.from("memberships").select("*, members!inner(deleted_at)", { count: "exact", head: true }).eq("status", "ACTIVO").lte("end_date", in7DaysStr).gte("end_date", nowStr).is("members.deleted_at", null),
    supabase.from("payments").select("amount, payment_date").eq("gym_id", gymId).eq("status", "PAGADO").gte("payment_date", sixMonthsAgoStr).lte("payment_date", todayStr).order("payment_date", { ascending: true }),
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
    const d = new Date(Date.UTC(nowArg.getUTCFullYear(), nowArg.getUTCMonth() - i, 1));
    revenueByMonth.set(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`, 0);
  }
  revenueRaw?.forEach((p) => {
    if (!p.payment_date) return;
    const d = new Date(p.payment_date);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">Resumen general de tu gimnasio</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Miembros Activos" value={String(activeMembers ?? 0)} subtitle="membresías vigentes" icon={Users} colorScheme="blue" />
        <StatCard title="Ingresos del Día" value={formatCurrency(todayRevenue)} subtitle="pagos de hoy" icon={DollarSign} colorScheme="green" />
        <StatCard title="Ingresos del Mes" value={formatCurrency(monthRevenue)} subtitle="pagos este mes" icon={DollarSign} colorScheme="violet"
          trend={revenueTrend !== null ? { value: Math.abs(revenueTrend), direction: revenueTrend >= 0 ? "up" : "down" } : undefined}
        />
        <StatCard title="Membresías Vencidas" value={String(expiredCount ?? 0)} subtitle={`${expiringSoon ?? 0} vencen en 7 días`} icon={UserX} colorScheme="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white dark:bg-[hsl(220,10%,20%)] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ingresos mensuales</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-5">Últimos 6 meses</p>
          <RevenueChart data={revenueChartData} />
        </div>
        <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-xl border border-gray-100 dark:border-white/10 p-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Próximos vencimientos</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-5">Vencen en 7 días</p>
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <CalendarClock className="w-8 h-8 text-amber-400" />
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{expiringSoon ?? 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">membresías por vencer</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-xl border border-gray-100 dark:border-white/10 p-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Últimos accesos</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-5">Últimas 10 entradas registradas</p>
        <RecentAccess logs={recentAccess} />
      </div>
    </div>
  );
}
