import Link from "next/link";
import { UserPlus, Users, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/members/StatusBadge";
import type { MemberStatus } from "@/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;
const VALID_STATUSES: MemberStatus[] = ["ACTIVO", "INACTIVO", "SUSPENDIDO"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const statusFilter =
    VALID_STATUSES.find((s) => s === params.status?.toUpperCase()) ?? null;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Build query — join memberships → plans for active membership info
  let dbQuery = supabase
    .from("members")
    .select(
      `
      id, first_name, last_name, dni, email, phone, photo_url, status,
      memberships(
        id, status, start_date, end_date,
        plans(id, name)
      )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("last_name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter) {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  if (query) {
    // ilike search on name concatenation and DNI
    dbQuery = dbQuery.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,dni.ilike.%${query}%,email.ilike.%${query}%`
    );
  }

  const { data: members, count, error } = await dbQuery;

  // Conteos globales (sin filtros)
  // Para activos: traemos member_id únicos con membresía ACTIVO
  const [{ count: totalMembers }, activeMembershipsData] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("memberships").select("member_id")
      .eq("status", "ACTIVO"),
  ]);
  // Contar member_ids únicos para evitar duplicados
  const activeMembers = new Set(activeMembershipsData.data?.map((m) => m.member_id) ?? []).size;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Helper to build search param URLs preserving existing params
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (statusFilter) p.set("status", statusFilter);
    p.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    });
    return `/dashboard/members?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalMembers ?? 0}</span> registrados
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeMembers ?? 0}</span> con membresía activa
            </span>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/members/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo miembro
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <form
            method="GET"
            action="/dashboard/members"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Buscar por nombre, DNI o email..."
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <div className="w-full sm:w-48">
              <Select name="status" defaultValue={statusFilter ?? "todos"}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="outline">
              Filtrar
            </Button>

            {(query || statusFilter) && (
              <Button type="button" variant="ghost" asChild>
                <Link href="/dashboard/members">Limpiar</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          Error al cargar los miembros. Por favor, recargá la página.
        </div>
      ) : !members || members.length === 0 ? (
        <EmptyState hasFilters={!!query || !!statusFilter} />
      ) : (
        <Card>
          <div className="overflow-hidden rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Miembro</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Teléfono
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Membresía activa
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  type MS = { id: string; status: string; start_date: string; end_date: string; plans: { id: string; name: string } | null };
                  const allMemberships = member.memberships as MS[];
                  // Membresía activa
                  const activeMembership = allMemberships
                    ?.filter((m) => m.status === "ACTIVO")
                    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
                  // Membresía vencida más reciente (si no tiene activa)
                  const expiredMembership = !activeMembership
                    ? allMemberships
                        ?.filter((m) => m.status === "VENCIDO")
                        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
                    : null;

                  return (
                    <TableRow key={member.id}>
                      {/* Avatar + nombre */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage
                              src={member.photo_url ?? undefined}
                              alt={`${member.first_name} ${member.last_name}`}
                            />
                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(
                                `${member.first_name} ${member.last_name}`
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-none">
                              {member.first_name} {member.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* DNI */}
                      <TableCell className="text-muted-foreground">
                        {member.dni ?? "—"}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                        {member.email ?? "—"}
                      </TableCell>

                      {/* Teléfono */}
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {member.phone ?? "—"}
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <StatusBadge status={member.status as MemberStatus} />
                      </TableCell>

                      {/* Membresía activa */}
                      <TableCell className="hidden xl:table-cell">
                        {activeMembership ? (
                          <div className="text-sm">
                            <p className="font-medium leading-none">
                              {activeMembership.plans?.name ?? "—"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Vence {formatDate(activeMembership.end_date)}
                            </p>
                          </div>
                        ) : expiredMembership ? (
                          <div className="text-sm">
                            <p className="font-medium leading-none text-red-500">
                              {expiredMembership.plans?.name ?? "—"}
                            </p>
                            <p className="mt-0.5 text-xs text-red-400">
                              Venció {formatDate(expiredMembership.end_date)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Sin membresía
                          </span>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs"
                          >
                            <Link href={`/dashboard/members/${member.id}`}>
                              Ver
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs"
                          >
                            <Link
                              href={`/dashboard/members/${member.id}/edit`}
                            >
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {count} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <Link href={buildUrl({ page: String(page - 1) })}>Anterior</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              aria-disabled={page >= totalPages}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              <Link href={buildUrl({ page: String(page + 1) })}>Siguiente</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <Users className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">
        {hasFilters ? "Sin resultados" : "No hay miembros aún"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Probá con otros filtros de búsqueda."
          : "Comenzá agregando tu primer miembro al sistema."}
      </p>
      {!hasFilters && (
        <Button asChild className="mt-6">
          <Link href="/dashboard/members/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar miembro
          </Link>
        </Button>
      )}
    </div>
  );
}
