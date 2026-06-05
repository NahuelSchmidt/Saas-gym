"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Dumbbell, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { loginAction, type AuthState } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Submit button — reads pending state from the nearest form
// ─────────────────────────────────────────────────────────────────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Iniciando sesión…
        </>
      ) : (
        "Iniciar sesión"
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md animate-[fade-in_0.3s_ease-out]">
      {/* Card */}
      <div className="rounded-2xl bg-white dark:bg-[hsl(220,10%,20%)] shadow-xl ring-1 ring-slate-200 px-8 py-10">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            GymFlow
          </h1>
          <p className="text-sm text-slate-500">
            Iniciá sesión para continuar
          </p>
        </div>

        {/* Error banner */}
        {state.error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white dark:bg-[hsl(220,10%,20%)] px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-[hsl(220,10%,20%)] px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="remember"
              className="text-sm text-slate-600 select-none cursor-pointer"
            >
              Recordarme
            </label>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <SubmitButton />
          </div>
        </form>

      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GymFlow. Todos los derechos reservados.
      </p>
    </div>
  );
}
