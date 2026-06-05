"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Plus, Trash2, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBranchAction, deleteBranchAction, type BranchState } from "./actions";
import type { Branch } from "@/types/database";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {pending ? "Creando…" : "Agregar sucursal"}
    </button>
  );
}

const initialState: BranchState = {};

export default function BranchesForm({ branches }: { branches: Branch[] }) {
  const [state, formAction] = useFormState(createBranchAction, initialState);

  async function handleDelete(id: string) {
    await deleteBranchAction(id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5" />
          Sucursales
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cada sucursal tiene su propio control de acceso. Los miembros pueden entrar a cualquiera.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Lista de sucursales existentes */}
        {branches.length > 0 && (
          <div className="space-y-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.name}</p>
                  {b.address && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.address}</p>}
                </div>
                <form action={() => handleDelete(b.id)}>
                  <button
                    type="submit"
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Eliminar sucursal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {branches.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            Todavía no hay sucursales. Agregá la primera abajo.
          </p>
        )}

        {/* Formulario nueva sucursal */}
        {state.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {state.success}
          </div>
        )}

        <form action={formAction} className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/10">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nueva sucursal</p>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" placeholder="Ej: Sucursal Centro" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Av. Siempre Viva 742" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="11 1234-5678" />
            </div>
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
