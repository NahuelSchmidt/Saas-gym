import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/members/MemberForm";

// ── Metadata (dynamic) ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("first_name, last_name")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!member) return { title: "Editar miembro | GymFlow" };

  return {
    title: `Editar ${member.first_name} ${member.last_name} | GymFlow`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !member) notFound();

  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/dashboard/members/${id}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al perfil
          </Link>
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar miembro</h1>
        <p className="text-sm text-muted-foreground">
          Modificando los datos de{" "}
          <span className="font-medium text-foreground">{fullName}</span>
        </p>
      </div>

      {/* Form prefilled with existing data */}
      <MemberForm member={member} />
    </div>
  );
}
