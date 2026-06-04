import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_id) redirect("/dashboard");

  const { data: gym } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", profile.gym_id)
    .single();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administrá los datos y la configuración de tu gimnasio
        </p>
      </div>
      <SettingsForm gym={gym} isOwner={profile.role === "OWNER"} />
    </div>
  );
}
