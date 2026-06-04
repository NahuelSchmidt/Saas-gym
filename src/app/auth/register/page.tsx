"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Building2, CheckCircle2, Dumbbell, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { registerAction, type AuthState } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Submit button
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
          Creando cuenta…
        </>
      ) : (
        "Crear cuenta"
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="w-full max-w-lg animate-[fade-in_0.3s_ease-out]">
      {/* Card */}
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 px-8 py-10">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            GymFlow
          </h1>
          <p className="text-sm text-slate-500">
            Creá tu cuenta y empezá a gestionar tu gimnasio
          </p>
        </div>

        {/* Error banner */}
        {state.error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Success banner (email confirmation) */}
        {state.success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Cuenta creada. Revisá tu email para confirmar tu dirección.
            </span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">

          {/* Gym name — full width, visually separated */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-1.5">
            <label
              htmlFor="gym_name"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-700"
            >
              <Building2 className="h-4 w-4" />
              Nombre del gimnasio
            </label>
            <input
              id="gym_name"
              name="gym_name"
              type="text"
              required
              placeholder="Ej: Iron Club, PowerFit, etc."
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* First name + Last name — two columns */}
          <div className="grid grid-cols-2 gap-4">
            <Field id="first_name" label="Nombre">
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                placeholder="Juan"
                className={inputClass}
              />
            </Field>
            <Field id="last_name" label="Apellido">
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                placeholder="García"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Email */}
          <Field id="email" label="Email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
              className={inputClass}
            />
          </Field>

          {/* Password */}
          <Field id="password" label="Contraseña">
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className={`${inputClass} pr-11`}
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
          </Field>

          {/* Confirm password */}
          <Field id="confirm_password" label="Confirmar contraseña">
            <div className="relative">
              <input
                id="confirm_password"
                name="confirm_password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Repetí tu contraseña"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>

          {/* Terms hint */}
          <p className="text-xs text-slate-500">
            Al registrarte aceptás nuestros{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Términos y condiciones
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de privacidad
            </Link>
            .
          </p>

          {/* Submit */}
          <div className="pt-1">
            <SubmitButton />
          </div>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">o</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} GymFlow. Todos los derechos reservados.
      </p>
    </div>
  );
}
