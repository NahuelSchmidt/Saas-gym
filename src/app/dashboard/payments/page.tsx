import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentMethodBadge } from "@/components/payments/PaymentMethodBadge";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { PaymentStatusUpdater } from "@/components/payments/PaymentStatusUpdater";
import {
  DollarSign,
  Clock,
  CalendarCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import type { PaymentWithDetails, PaymentStatus, PaymentMethod } from "@/types/database";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

// ── Search params type ─────────────────────────────────────────────────────────

interface SearchParams {
  page?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();
  if (!profile?.gym_id) redirect("/auth/login");
  const gymId = profile.gym_id;

  // ── Date range defaults (current month) ──────────────────────────────────────
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const filterFrom = params.from ?? defaultFrom;
  const filterTo = params.to ?? defaultTo;
  const filterStatus = params.status as PaymentStatus | undefined;
  const filterMethod = params.method as PaymentMethod | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // ── Summary stats (always this month) ────────────────────────────────────────
  const [
    { data: monthPaidData },
    { data: pendingData },
    { data: todayData },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount")
      .eq("gym_id", gymId)
      .eq("status", "PAGADO")
      .gte("payment_date", defaultFrom)
      .lte("payment_date", defaultTo),
    supabase
      .from("payments")
      .select("amount")
      .eq("gym_id", gymId)
      .eq("status", "PENDIENTE"),
    supabase
      .from("payments")
      .select("amount, id")
      .eq("gym_id", gymId)
      .eq("status", "PAGADO")
      .eq("payment_date", now.toISOString().split("T")[0]),
  ]);

  const monthTotal = (monthPaidData ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const pendingTotal = (pendingData ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const todayTotal = (todayData ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const todayCount = todayData?.length ?? 0;
  const pendingCount = pendingData?.length ?? 0;

  // ── Filtered payments query ───────────────────────────────────────────────────
  let query = supabase
    .from("payments")
    .select(
      "*, members(id, first_name, last_name), memberships(id, plan_id, plans(name))",
      { count: "exact" }
    )
    .eq("gym_id", gymId)
    .gte("payment_date", filterFrom)
    .lte("payment_date", filterTo)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filterStatus) query = query.eq("status", filterStatus);
  if (filterMethod) query = query.eq("payment_method", filterMethod);

  const { data: paymentsRaw, count: totalCount, error: paymentsError } = await query;

  if (paymentsError) {
    console.error("Error al obtener pagos:", paymentsError.message);
  }

  type RawPayment = (typeof paymentsRaw)[number] & {
    members: { id: string; first_name: string; last_name: string } | null;
    memberships: { id: string; plan_id: string; plans: { name: string } | null } | null;
  };

  const payments = (paymentsRaw as RawPayment[] | null) ?? [];
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  // ── Build pagination href helper ──────────────────────────────────────────────
  function pageHref(p: number) {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    if (filterStatus) sp.set("status", filterStatus);
    if (filterMethod) sp.set("method", filterMethod);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    return `/dashboard/payments?${sp.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pagos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de cobros y estado de membresías
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payments/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Registrar pago
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Total del mes"
          value={formatCurrency(monthTotal)}
          sub={`${formatDate(defaultFrom)} — ${formatDate(defaultTo)}`}
        />
        <SummaryCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Cobros pendientes"
          value={formatCurrency(pendingTotal)}
          sub={`${pendingCount} pago${pendingCount !== 1 ? "s" : ""} sin confirmar`}
        />
        <SummaryCard
          icon={CalendarCheck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Cobros del día"
          value={formatCurrency(todayTotal)}
          sub={`${todayCount} pago${todayCount !== 1 ? "s" : ""} hoy`}
        />
      </div>

      {/* Filters */}
      <PaymentFilters
        currentStatus={filterStatus}
        currentMethod={filterMethod}
        currentFrom={filterFrom}
        currentTo={filterTo}
      />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Historial de pagos
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalCount ?? 0} resultado{(totalCount ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Sin pagos en este período</p>
              <p className="mt-1 text-xs text-gray-400">
                Ajustá los filtros o registrá un nuevo pago.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const member = payment.members;
                  const planName = payment.memberships?.plans?.name ?? null;
                  const memberName = member
                    ? `${member.first_name} ${member.last_name}`
                    : "—";
                  const period =
                    payment.period_start && payment.period_end
                      ? `${formatDate(payment.period_start)} – ${formatDate(payment.period_end)}`
                      : "—";

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{memberName}</p>
                          {planName && (
                            <p className="text-xs text-muted-foreground">{planName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(payment.payment_date)}
                      </TableCell>
                      <TableCell>
                        <PaymentMethodBadge method={payment.payment_method} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{period}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PaymentStatusUpdater
                          paymentId={payment.id}
                          currentStatus={payment.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? (
                <Link href={pageHref(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={pageHref(page + 1)}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SummaryCard ────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}

function SummaryCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
