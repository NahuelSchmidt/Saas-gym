"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Gym } from "@/types/database";

interface SettingsFormProps {
  gym: Gym | null;
  isOwner: boolean;
}

export default function SettingsForm({ gym, isOwner }: SettingsFormProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: gym?.name ?? "",
    address: gym?.address ?? "",
    phone: gym?.phone ?? "",
    timezone: gym?.timezone ?? "America/Argentina/Buenos_Aires",
    currency: gym?.currency ?? "ARS",
    mercadopago_access_token: gym?.mercadopago_access_token ?? "",
    mercadopago_public_key: gym?.mercadopago_public_key ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gym?.id) return;

    startTransition(async () => {
      const { error } = await supabase
        .from("gyms")
        .update({
          name: form.name,
          address: form.address,
          phone: form.phone,
          timezone: form.timezone,
          currency: form.currency,
          mercadopago_access_token: form.mercadopago_access_token || null,
          mercadopago_public_key: form.mercadopago_public_key || null,
        })
        .eq("id", gym.id);

      if (error) {
        toast.error("Error al guardar los cambios");
      } else {
        toast.success("Configuración guardada correctamente");
      }
    });
  }

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Solo el propietario puede modificar la configuración del gimnasio.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos del gimnasio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del gimnasio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del gimnasio</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Zona horaria</Label>
              <select
                id="timezone"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                <option value="America/Argentina/Cordoba">Argentina (Córdoba)</option>
                <option value="America/Montevideo">Uruguay</option>
                <option value="America/Santiago">Chile</option>
                <option value="America/Bogota">Colombia</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ARS">Peso argentino (ARS)</option>
                <option value="UYU">Peso uruguayo (UYU)</option>
                <option value="CLP">Peso chileno (CLP)</option>
                <option value="COP">Peso colombiano (COP)</option>
                <option value="USD">Dólar estadounidense (USD)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
