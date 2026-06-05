"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp } from "lucide-react";

interface AccessLog {
  entry_time: string;
  access_granted: boolean;
}

interface Props {
  logs: AccessLog[];
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const BLUE = "#2563eb";
const BLUE_LIGHT = "#93c5fd";

export default function ActivityCharts({ logs }: Props) {
  const granted = logs.filter((l) => l.access_granted);

  // ── Días de la semana ──────────────────────────────────────────────────────
  const byDay = Array.from({ length: 7 }, (_, i) => ({ day: DAYS[i], ingresos: 0 }));
  granted.forEach((l) => {
    const d = new Date(l.entry_time).getDay();
    byDay[d].ingresos++;
  });
  const maxDay = Math.max(...byDay.map((d) => d.ingresos), 1);

  // ── Horarios ──────────────────────────────────────────────────────────────
  const byHour = Array.from({ length: 24 }, (_, i) => ({
    hora: `${i.toString().padStart(2, "0")}:00`,
    ingresos: 0,
  }));
  granted.forEach((l) => {
    const h = new Date(l.entry_time).getHours();
    byHour[h].ingresos++;
  });
  const maxHour = Math.max(...byHour.map((h) => h.ingresos), 1);

  // ── Tendencia diaria ───────────────────────────────────────────────────────
  const byDate: Record<string, number> = {};
  granted.forEach((l) => {
    const date = l.entry_time.split("T")[0];
    byDate[date] = (byDate[date] ?? 0) + 1;
  });
  const trend = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ingresos]) => ({
      fecha: date.slice(5), // MM-DD
      ingresos,
    }));

  if (granted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
        <TrendingUp className="w-12 h-12 opacity-30" />
        <p className="text-lg font-medium">Sin datos de actividad para el período</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Días más movidos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-blue-600" />
            Días más movidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, "Ingresos"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="ingresos" radius={[6, 6, 0, 0]}>
                {byDay.map((entry, i) => (
                  <Cell key={i} fill={entry.ingresos === maxDay ? BLUE : BLUE_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Horarios más movidos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-blue-600" />
            Horarios más movidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byHour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="hora"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, "Ingresos"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                {byHour.map((entry, i) => (
                  <Cell key={i} fill={entry.ingresos === maxHour ? BLUE : BLUE_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tendencia diaria */}
      {trend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Ingresos por día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, "Ingresos"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="ingresos" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
