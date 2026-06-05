import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ReportsExportButton from "./ReportsExportButton";
import ActivityCharts from "./ActivityCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reportes" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { tab?: string; from?: string; to?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tab = searchParams.tab ?? "cobros";
  const now = new Date();
  const fromDate = searchParams.from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const toDate = searchParams.to ?? now.toISOString().split("T")[0];

  let reportData: unknown[] = [];
  let totalAmount = 0;

  if (tab === "cobros") {
    const { data } = await supabase
      .from("payments")
      .select("id, payment_date, amount, payment_method, status, members(first_name, last_name), memberships(plans(name))")
      .gte("payment_date", fromDate)
      .lte("payment_date", toDate + "T23:59:59")
      .order("payment_date", { ascending: false });

    reportData = data ?? [];
    totalAmount = (data ?? []).reduce((s: number, p: { amount?: number }) => s + (p.amount ?? 0), 0);
  } else if (tab === "asistencia") {
    const { data } = await supabase
      .from("access_logs")
      .select("id, entry_time, exit_time, access_granted, members(first_name, last_name)")
      .gte("entry_time", fromDate)
      .lte("entry_time", toDate + "T23:59:59")
      .order("entry_time", { ascending: false });

    reportData = data ?? [];
  } else if (tab === "actividad") {
    const { data } = await supabase
      .from("access_logs")
      .select("entry_time, access_granted")
      .gte("entry_time", fromDate)
      .lte("entry_time", toDate + "T23:59:59")
      .order("entry_time", { ascending: true });

    reportData = data ?? [];
  } else if (tab === "miembros") {
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, dni, email, status, join_date, memberships(status, end_date, plans(name))")
      .is("deleted_at", null)
      .order("first_name");

    reportData = data ?? [];
  }

  const tabs = [
    { id: "cobros", label: "Cobros" },
    { id: "asistencia", label: "Asistencia" },
    { id: "miembros", label: "Miembros" },
    { id: "actividad", label: "Actividad" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">Analizá la actividad de tu gimnasio</p>
        </div>
        <ReportsExportButton tab={tab} from={fromDate} to={toDate} data={reportData} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}&from=${fromDate}&to=${toDate}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white dark:bg-[hsl(220,10%,26%)] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Date range filter */}
      <form className="flex items-center gap-3 flex-wrap">
        <input type="hidden" name="tab" value={tab} />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={fromDate}
            className="border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={toDate}
            className="border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-[hsl(220,10%,22%)] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Filtrar
        </button>
      </form>

      {/* Summary card for cobros */}
      {tab === "cobros" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total del período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cantidad de cobros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reportData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ticket promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reportData.length > 0 ? formatCurrency(totalAmount / reportData.length) : "$0"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actividad */}
      {tab === "actividad" && (
        <ActivityCharts logs={reportData as { entry_time: string; access_granted: boolean }[]} />
      )}

      {/* Report tables */}
      {tab !== "actividad" && <Card>
        <CardContent className="p-0">
          {tab === "cobros" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData as Array<{
                  id: string;
                  payment_date: string;
                  amount: number;
                  payment_method: string;
                  status: string;
                  members: { first_name: string; last_name: string } | null;
                  memberships: { plans: { name: string } | null } | null;
                }>).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.members ? `${p.members.first_name} ${p.members.last_name}` : "—"}
                    </TableCell>
                    <TableCell>{formatDate(p.payment_date)}</TableCell>
                    <TableCell>{p.memberships?.plans?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{p.payment_method}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PAGADO" ? "success" : p.status === "PENDIENTE" ? "warning" : "destructive"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Sin datos para el período seleccionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === "asistencia" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData as Array<{
                  id: string;
                  entry_time: string;
                  exit_time: string | null;
                  access_granted: boolean;
                  members: { first_name: string; last_name: string } | null;
                }>).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.members ? `${log.members.first_name} ${log.members.last_name}` : "—"}
                    </TableCell>
                    <TableCell>{formatDate(log.entry_time, "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>
                      {log.exit_time ? formatDate(log.exit_time, "HH:mm") : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.access_granted ? "success" : "destructive"}>
                        {log.access_granted ? "Permitido" : "Denegado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                      Sin registros en el período seleccionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === "miembros" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead>Plan activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData as Array<{
                  id: string;
                  first_name: string;
                  last_name: string;
                  dni: string | null;
                  email: string | null;
                  status: string;
                  join_date: string;
                  memberships: Array<{ status: string; end_date: string; plans: { name: string } | null }>;
                }>).map((m) => {
                  const activeMembership = m.memberships?.find((ms) => ms.status === "ACTIVO");
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                      <TableCell>{m.dni ?? "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{m.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === "ACTIVO" ? "success" : m.status === "SUSPENDIDO" ? "destructive" : "secondary"}>
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(m.join_date)}</TableCell>
                      <TableCell>
                        {activeMembership ? (
                          <span className="text-sm">{activeMembership.plans?.name} · hasta {formatDate(activeMembership.end_date)}</span>
                        ) : <span className="text-gray-400 text-sm">Sin membresía</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Sin miembros registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}
