import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/members/MemberForm";

export const metadata: Metadata = {
  title: "Nuevo miembro | GymFlow",
};

export default function NewMemberPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/members">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a miembros
          </Link>
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo miembro</h1>
        <p className="text-sm text-muted-foreground">
          Completá los datos para registrar un nuevo miembro en el sistema.
        </p>
      </div>

      {/* Form */}
      <MemberForm />
    </div>
  );
}
