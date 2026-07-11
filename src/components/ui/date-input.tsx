"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import "react-day-picker/style.css";

interface DateInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
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

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
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
  const [open, setOpen] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) setDisplay(toDisplay(value));
  }, [value]);

  function commit(iso: string) {
    if (hiddenRef.current) hiddenRef.current.value = iso;
    onChange?.(iso);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d/]/g, "");
    if (raw.length === 2 && display.length === 1) raw = raw + "/";
    if (raw.length === 5 && display.length === 4) raw = raw + "/";
    if (raw.length > 10) return;

    setDisplay(raw);
    setError(false);

    if (raw.length === 10) {
      if (isValidDate(raw)) {
        commit(toISO(raw));
        setError(false);
      } else {
        setError(true);
        commit("");
      }
    } else {
      commit("");
    }
  }

  function handleBlur() {
    if (display && display.length > 0 && display.length < 10) setError(true);
  }

  function handleDaySelect(date: Date | undefined) {
    if (!date) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    setDisplay(`${d}/${m}/${y}`);
    setError(false);
    commit(iso);
    setOpen(false);
  }

  const isoValue = isValidDate(display) ? toISO(display) : "";
  const selectedDate = isoToDate(isoValue);

  return (
    <>
      <div className="flex gap-1.5">
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              locale={es}
              defaultMonth={selectedDate ?? new Date()}
              classNames={{
                today: "font-bold text-blue-600",
                selected: "bg-blue-600 text-white rounded-md",
                day: "h-8 w-8 text-sm rounded-md hover:bg-muted cursor-pointer flex items-center justify-center",
                month_caption: "text-sm font-medium px-2 py-1",
                nav: "flex items-center gap-1",
                button_previous: "h-7 w-7 flex items-center justify-center rounded hover:bg-muted",
                button_next: "h-7 w-7 flex items-center justify-center rounded hover:bg-muted",
                weekdays: "text-xs text-muted-foreground",
                month_grid: "mt-2",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
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
