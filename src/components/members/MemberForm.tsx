"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2, Upload, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createMemberAction, updateMemberAction } from "./MemberActions";
import type { Member } from "@/types/database";

// ── Zod Schema ────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  first_name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  last_name: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  dni: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  address: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .or(z.literal("")),
  emergency_contact_name: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  emergency_contact_phone: z
    .string()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO"]).optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

type MemberFormValues = z.infer<typeof memberSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface MemberFormProps {
  member?: Member;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MemberForm({ member }: MemberFormProps) {
  const isEdit = !!member;
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    member?.photo_url ?? null
  );
  const [statusValue, setStatusValue] = useState<string>(
    member?.status ?? "ACTIVO"
  );

  // Bind the server action for edit mode
  const boundUpdate = updateMemberAction.bind(null, member?.id ?? "");
  const action = isEdit ? boundUpdate : createMemberAction;

  const [state, formAction] = useFormState(action, {});

  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: member?.first_name ?? "",
      last_name: member?.last_name ?? "",
      dni: member?.dni ?? "",
      birth_date: member?.birth_date ?? "",
      email: member?.email ?? "",
      phone: member?.phone ?? "",
      address: member?.address ?? "",
      emergency_contact_name: member?.emergency_contact_name ?? "",
      emergency_contact_phone: member?.emergency_contact_phone ?? "",
      status: member?.status ?? "ACTIVO",
      notes: member?.notes ?? "",
    },
  });

  // Keep RHF in sync with select changes for status
  useEffect(() => {
    setValue("status", statusValue as "ACTIVO" | "INACTIVO" | "SUSPENDIDO");
  }, [statusValue, setValue]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* Server-side error */}
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* ── Foto de perfil ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center shrink-0">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {photoPreview ? "Cambiar foto" : "Subir foto"}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o WEBP. Máximo 5 MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Datos personales ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="first_name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="Ej. Lucas"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">
                {errors.first_name.message}
              </p>
            )}
          </div>

          {/* Apellido */}
          <div className="space-y-1.5">
            <Label htmlFor="last_name">
              Apellido <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Ej. Fernández"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">
                {errors.last_name.message}
              </p>
            )}
          </div>

          {/* DNI */}
          <div className="space-y-1.5">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              placeholder="Ej. 30123456"
              {...register("dni")}
            />
            {errors.dni && (
              <p className="text-xs text-destructive">{errors.dni.message}</p>
            )}
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <DateInput
              id="birth_date"
              name="birth_date"
              value={watch("birth_date") ?? ""}
              onChange={(val) => setValue("birth_date", val)}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+54 11 1234-5678"
              {...register("phone")}
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Calle, número, ciudad"
              {...register("address")}
            />
          </div>

          {/* Status — solo en edición */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <Select
                name="status"
                value={statusValue}
                onValueChange={setStatusValue}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              {/* Hidden input so formData contains the value */}
              <input type="hidden" name="status" value={statusValue} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Contacto de emergencia ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto de emergencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_name">Nombre completo</Label>
            <Input
              id="emergency_contact_name"
              placeholder="Nombre del contacto"
              {...register("emergency_contact_name")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_phone">Teléfono</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder="+54 11 1234-5678"
              {...register("emergency_contact_phone")}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Notas ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas internas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones, condiciones médicas, preferencias..."
              rows={4}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Acciones ── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}

// ── Submit button (reads pending state via useFormStatus) ─────────────────────

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEdit ? "Guardar cambios" : "Crear miembro"}
    </Button>
  );
}
