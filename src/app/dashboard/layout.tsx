import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, avatar_url, gym_id, gyms(id, name)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  const gymData = profile.gyms as { id: string; name: string } | null;
  const gymName = gymData?.name ?? "GymFlow";
  const userName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    user.email ||
    "Usuario";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-white/5 dark:bg-[hsl(220,10%,14%)] overflow-hidden">
      <Sidebar
        gymName={gymName}
        userEmail={user.email ?? ""}
        userRole={profile.role ?? "STAFF"}
        userName={userName}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          gymName={gymName}
          userEmail={user.email ?? ""}
          userName={userName}
          avatarUrl={profile.avatar_url ?? null}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
