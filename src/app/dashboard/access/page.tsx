import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccessControl } from "./AccessControl";
import { TodayLog, type TodayLogEntry } from "./TodayLog";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get gym_id for this user
  const { data: profile } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("id", user.id)
    .single();

  if (!profile?.gym_id) redirect("/auth/login");

  // Fetch today's access logs joined with member names
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: rawLogs } = await supabase
    .from("access_logs")
    .select(
      "id, member_id, entry_time, exit_time, access_granted, denial_reason, members(first_name, last_name)"
    )
    .eq("gym_id", profile.gym_id)
    .gte("entry_time", todayStart.toISOString())
    .order("entry_time", { ascending: false });

  const logs: TodayLogEntry[] = (rawLogs ?? []).map((log) => {
    const m = log.members as { first_name: string; last_name: string } | null;
    const name = m ? `${m.first_name} ${m.last_name}` : "Miembro desconocido";
    return {
      id: log.id,
      member_id: log.member_id,
      member_name: name,
      member_initials: name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      entry_time: log.entry_time,
      exit_time: log.exit_time,
      access_granted: log.access_granted,
      denial_reason: log.denial_reason,
    };
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page title — visible when kiosk is idle */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portería</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control de acceso al gimnasio
        </p>
      </div>

      {/* Kiosk panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
        <AccessControl />
      </div>

      {/* Today's log — server rendered, refreshable by the client */}
      <TodayLog logs={logs} />
    </div>
  );
}
