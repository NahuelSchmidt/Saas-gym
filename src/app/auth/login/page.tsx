"use client";

import { useState } from "react";
import { AlertCircle, Dumbbell, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("invalid")) {
        setError("Email o contraseña incorrectos.");
      } else {
        setError("Ocurrió un error al iniciar sesión. Intentá de nuevo.");
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md animate-[fade-in_0.3s_ease-out]">
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 px-8 py-10">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">GymFlow</h1>
          <p className="text-sm text-slate-500">Iniciá sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@email.com" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password" required placeholder="••••••••"
                className={`${inputClass} pr-11`}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Iniciando sesión…</>) : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GymFlow. Todos los derechos reservados.
      </p>
    </div>
  );
}
