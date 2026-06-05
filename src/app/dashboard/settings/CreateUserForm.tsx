"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction, type CreateUserState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {pending ? "Creando…" : "Crear usuario"}
    </button>
  );
}

const initialState: CreateUserState = {};

export default function CreateUserForm() {
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-5 w-5" />
          Crear usuario
        </CardTitle>
        <p className="text-sm text-gray-500">
          Creá accesos para el personal de tu gimnasio.
        </p>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {state.success}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" name="first_name" placeholder="Juan" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Apellido</Label>
              <Input id="last_name" name="last_name" placeholder="García" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="staff@gimnasio.com" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
          </div>

          <input type="hidden" name="role" value="STAFF" />

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
