import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { Dumbbell, Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ gymId: string }>;
  searchParams: Promise<{ error?: string }>;
}

async function searchByDni(gymId: string, formData: FormData) {
  "use server";
  const dni = (formData.get("dni") as string)?.trim();
  if (!dni) redirect(`/portal/g/${gymId}?error=1`);

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("gym_id", gymId)
    .eq("dni", dni)
    .is("deleted_at", null)
    .single();

  if (!member) redirect(`/portal/g/${gymId}?error=1`);
  redirect(`/portal/${member.id}`);
}

export default async function PortalGymSearchPage({ params, searchParams }: PageProps) {
  const { gymId } = await params;
  const { error } = await searchParams;

  if (!/^[0-9a-f-]{36}$/i.test(gymId)) notFound();

  const supabase = createAdminClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("name")
    .eq("id", gymId)
    .single();

  if (!gym) notFound();

  const action = searchByDni.bind(null, gymId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 dark:from-[hsl(220,10%,12%)] dark:to-[hsl(220,10%,16%)] flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center text-white mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 mb-3">
          <Dumbbell className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-white/80">{gym.name}</p>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl shadow-xl p-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-1">
          Mi membresía
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-6">
          Ingresá tu DNI para ver tu información
        </p>

        <form action={action} className="space-y-3">
          <input
            type="text"
            name="dni"
            inputMode="numeric"
            placeholder="DNI sin puntos"
            autoFocus
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-transparent px-4 py-3 text-center text-lg font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-center text-sm text-red-500">
              No encontramos un socio con ese DNI
            </p>
          )}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </form>
      </div>
    </div>
  );
}
