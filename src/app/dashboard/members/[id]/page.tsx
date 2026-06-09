import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldAlert,
  QrCode,
  Pencil,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatCurrency, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/members/StatusBadge";
import { DeleteMemberButton } from "@/components/members/DeleteMemberButton";
import { QRModal } from "@/components/members/QRModal";
import { AssignPlanDialog } from "@/components/members/AssignPlanDialog";
import type {
  MemberStatus,
  MembershipStatus,
  PaymentStatus,
} from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────────────────────

function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  const config: Record<MembershipStatus, { label: string; className: string }> =
    {
      ACTIVO: { label: "Activa", className: "bg-green-100 text-green-800 border-green-200" },
      VENCIDO: { label: "Vencida", className: "bg-red-100 text-red-800 border-red-200" },
      PAUSADO: { label: "Pausada", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      CANCELADO: { label: "Cancelada", className: "bg-gray-100 text-gray-700 border-gray-200" },
    };
  const c = config[status] ?? config.CANCELADO;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; variant: "success" | "secondary" | "destructive" | "warning" | "outline" }> = {
    PAGADO: { label: "Pagado", variant: "success" },
    PENDIENTE: { label: "Pendiente", variant: "warning" },
    VENCIDO: { label: "Vencido", variant: "destructive" },
    PARCIAL: { label: "Parcial", variant: "secondary" },
  };
  const c = config[status] ?? config.PENDIENTE;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  MERCADOPAGO: "MercadoPago",
  TARJETA: "Tarjeta",
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch member
  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !member) notFound();

  // Fetch memberships with plan info
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, plans(id, name, price, duration_days)")
    .eq("member_id", id)
    .order("start_date", { ascending: false });

  // Fetch last 10 payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*, memberships(id, plans(name))")
    .eq("member_id", id)
    .order("payment_date", { ascending: false })
    .limit(10);

  // Fetch active plans for assignment
  const { data: availablePlans } = await supabase
    .from("plans")
    .select("id, name, price, duration_days")
    .eq("is_active", true)
    .order("price");

  // Fetch last 10 access logs
  const { data: accessLogs } = await supabase
    .from("access_logs")
    .select("*")
    .eq("member_id", id)
    .order("entry_time", { ascending: false })
    .limit(10);

  // Determine active membership
  const activeMembership = memberships?.find((m) => m.status === "ACTIVO");
  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/members">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a miembros
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <AssignPlanDialog
            memberId={member.id}
            plans={availablePlans ?? []}
            currentEndDate={activeMembership?.end_date ?? null}
          />
          <QRModal
            memberName={fullName}
            qrCode={member.qr_code}
            memberId={member.id}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/members/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeleteMemberButton memberId={id} memberName={fullName} />
        </div>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 shrink-0 text-2xl">
              <AvatarImage src={member.photo_url ?? undefined} alt={fullName} />
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{fullName}</h1>
                <StatusBadge status={member.status as MemberStatus} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {member.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </span>
                )}
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {member.phone}
                  </span>
                )}
                {member.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.address}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Miembro desde {formatDate(member.join_date)}
                {member.dni ? ` · DNI ${member.dni}` : ""}
                {member.birth_date
                  ? ` · Nacimiento: ${formatDate(member.birth_date)}`
                  : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs via hash routing (no JS required — anchor-based) */}
      <div className="space-y-6">
        {/* ── Sección: Información ── */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Membresía activa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Membresía activa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMembership ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {(activeMembership as { plans?: { name?: string } }).plans?.name ?? "Plan desconocido"}
                    </span>
                    <MembershipStatusBadge
                      status={activeMembership.status as MembershipStatus}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Inicio</dt>
                      <dd className="font-medium">
                        {formatDate(activeMembership.start_date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Vencimiento</dt>
                      <dd className="font-medium">
                        {formatDate(activeMembership.end_date)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tiene ninguna membresía activa en este momento.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contacto de emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Contacto de emergencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.emergency_contact_name ||
              member.emergency_contact_phone ? (
                <dl className="space-y-2 text-sm">
                  {member.emergency_contact_name && (
                    <div>
                      <dt className="text-muted-foreground">Nombre</dt>
                      <dd className="font-medium">
                        {member.emergency_contact_name}
                      </dd>
                    </div>
                  )}
                  {member.emergency_contact_phone && (
                    <div>
                      <dt className="text-muted-foreground">Teléfono</dt>
                      <dd className="font-medium flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {member.emergency_contact_phone}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se registró contacto de emergencia.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          {member.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{member.notes}</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Sección: Historial de pagos ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Historial de pagos
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Últimos 10 registros
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!payments || payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No hay pagos registrados para este miembro.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {formatDate(payment.payment_date)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(payment as { memberships?: { plans?: { name?: string } } | null })
                          .memberships?.plans?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[payment.payment_method] ??
                          payment.payment_method}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          status={payment.status as PaymentStatus}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ── Sección: Historial de accesos ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Historial de accesos
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Últimos 10 registros
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!accessLogs || accessLogs.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No hay registros de acceso para este miembro.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingreso</TableHead>
                    <TableHead>Egreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Motivo de denegación
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(log.entry_time)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.exit_time ? formatDateTime(log.exit_time) : "—"}
                      </TableCell>
                      <TableCell>
                        {log.access_granted ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Permitido
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            Denegado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {log.denial_reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
