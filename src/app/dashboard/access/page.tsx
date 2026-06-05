import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccessControl } from "./AccessControl";
import { TodayLog, type TodayLogEntry } from "./TodayLog";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_id) redirect("/auth/login");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: rawLogs }, { data: branches }, { data: allMembers, error: membersError }] = await Promise.all([
    supabase
      .from("access_logs")
      .select("id, member_id, entry_time, exit_time, access_granted, denial_reason, branch_id, members(first_name, last_name), branches(name)")
      .eq("gym_id", profile.gym_id)
      .gte("entry_time", todayStart.toISOString())
      .order("entry_time", { ascending: false }),
    supabase
      .from("branches")
      .select("id, name")
      .eq("gym_id", profile.gym_id)
      .eq("is_active", true)
      .order("created_at"),
    supabase
      .from("members")
      .select("id, first_name, last_name, dni, photo_url, status")
      .eq("gym_id", profile.gym_id)
      .is("deleted_at", null)
      .order("first_name"),
  ]);

  if (membersError) console.error("[AccessPage] members error:", membersError.message);

  const logs: TodayLogEntry[] = (rawLogs ?? []).map((log) => {
    const m = log.members as { first_name: string; last_name: string } | null;
    const name = m ? `${m.first_name} ${m.last_name}` : "Miembro desconocido";
    const b = log.branches as { name: string } | null;
    return {
      id: log.id,
      member_id: log.member_id,
      member_name: name,
      member_initials: name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase(),
      entry_time: log.entry_time,
      exit_time: log.exit_time,
      access_granted: log.access_granted,
      denial_reason: log.denial_reason,
      branch_name: b?.name ?? null,
    };
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Portería</h1>
        <p className="mt-1 text-sm text-gray-500">Control de acceso al gimnasio</p>
      </div>

      <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden relative">
        <AccessControl branches={branches ?? []} members={allMembers ?? []} />
      </div>

      <TodayLog logs={logs} />
    </div>
  );
}
