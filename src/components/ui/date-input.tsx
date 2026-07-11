"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

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

function MiniCalendar({ selected, onSelect }: { selected?: Date; onSelect: (d: Date) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday-based: 0=Mon ... 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  function isSelected(day: number) {
    return selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
  }
  function isToday(day: number) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  }

  return (
    <div className="p-3 w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {MONTHS_ES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div key={i} className="h-8 flex items-center justify-center">
            {day ? (
              <button
                type="button"
                onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
                className={cn(
                  "h-8 w-8 rounded-md text-sm transition-colors",
                  isSelected(day)
                    ? "bg-blue-600 text-white font-semibold"
                    : isToday(day)
                    ? "border border-blue-500 text-blue-600 font-semibold hover:bg-muted"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
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
      if (isValidDate(raw)) { commit(toISO(raw)); setError(false); }
      else { setError(true); commit(""); }
    } else { commit(""); }
  }

  function handleBlur() {
    if (display && display.length > 0 && display.length < 10) setError(true);
  }

  function handleDaySelect(date: Date) {
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
  const selectedDate = isoValue ? (() => { const [y,m,d] = isoValue.split("-").map(Number); return new Date(y, m-1, d); })() : undefined;

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
            error ? "border-destructive focus-visible:ring-destructive" : "border-input focus-visible:ring-ring",
            className
          )}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <MiniCalendar selected={selectedDate} onSelect={handleDaySelect} />
          </PopoverContent>
        </Popover>
      </div>
      <input ref={hiddenRef} type="hidden" name={name} value={isoValue} required={required} />
      {error && <p className="text-xs text-destructive mt-1">Fecha inválida. Usá DD/MM/AAAA</p>}
    </>
  );
}
