"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value?: string;           // YYYY-MM-DD
  defaultValue?: string;    // YYYY-MM-DD
  onChange?: (value: string) => void; // devuelve YYYY-MM-DD
  name?: string;
  id?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

function toDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function toISO(display: string): string {
  if (!display) return "";
  const [d, m, y] = display.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function isValidDate(str: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  const [d, m, y] = str.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function DateInput({
  value,
  defaultValue,
  onChange,
  name,
  id,
  required,
  className,
  placeholder = "DD/MM/AAAA",
}: DateInputProps) {
  const initialDisplay = toDisplay(value ?? defaultValue ?? "");
  const [display, setDisplay] = useState(initialDisplay);
  const [error, setError] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Sincronizar si el value cambia desde afuera
  useEffect(() => {
    if (value !== undefined) {
      setDisplay(toDisplay(value));
    }
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d/]/g, "");

    // Auto-insertar "/" después del día y mes
    if (raw.length === 2 && display.length === 1) raw = raw + "/";
    if (raw.length === 5 && display.length === 4) raw = raw + "/";

    // Limitar largo
    if (raw.length > 10) return;

    setDisplay(raw);
    setError(false);

    if (raw.length === 10) {
      if (isValidDate(raw)) {
        const iso = toISO(raw);
        if (hiddenRef.current) hiddenRef.current.value = iso;
        onChange?.(iso);
        setError(false);
      } else {
        setError(true);
        if (hiddenRef.current) hiddenRef.current.value = "";
        onChange?.("");
      }
    } else {
      if (hiddenRef.current) hiddenRef.current.value = "";
    }
  }

  function handleBlur() {
    if (display && display.length > 0 && display.length < 10) {
      setError(true);
    }
  }

  const isoValue = isValidDate(display) ? toISO(display) : "";

  return (
    <>
      <input
        type="text"
        id={id}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        className={cn(
          "flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input focus-visible:ring-ring",
          className
        )}
      />
      {/* Hidden input para form submission */}
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        value={isoValue}
        required={required}
      />
      {error && (
        <p className="text-xs text-destructive mt-1">Fecha inválida. Usá DD/MM/AAAA</p>
      )}
    </>
  );
}
