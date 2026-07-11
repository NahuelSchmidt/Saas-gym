import { TrendingUp, TrendingDown } from "lucide-react";

type ColorScheme = "blue" | "green" | "violet" | "red" | "amber" | "gray";

interface TrendProps {
  value: number;
  direction: "up" | "down";
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: TrendProps;
  colorScheme?: ColorScheme;
}

const colorMap: Record<ColorScheme, { iconColor: string; dot: string }> = {
  blue:   { iconColor: "text-orange-500",   dot: "bg-orange-500" },
  green:  { iconColor: "text-emerald-500", dot: "bg-emerald-500" },
  violet: { iconColor: "text-violet-500",  dot: "bg-violet-500" },
  red:    { iconColor: "text-red-500",     dot: "bg-red-500" },
  amber:  { iconColor: "text-amber-500",   dot: "bg-amber-500" },
  gray:   { iconColor: "text-gray-400",    dot: "bg-gray-400" },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, colorScheme = "blue" }: StatCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-xl border border-gray-100 dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</p>
        <Icon className={`w-4 h-4 ${colors.iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            trend.direction === "up" ? "text-emerald-500" : "text-red-500"
          }`}>
            {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
