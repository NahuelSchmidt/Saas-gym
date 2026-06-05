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

const colorMap: Record<ColorScheme, { iconBg: string; iconColor: string }> = {
  blue:   { iconBg: "bg-blue-50 dark:bg-blue-500/20",    iconColor: "text-blue-600 dark:text-blue-400" },
  green:  { iconBg: "bg-emerald-50 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400" },
  violet: { iconBg: "bg-violet-50 dark:bg-violet-500/20",  iconColor: "text-violet-600 dark:text-violet-400" },
  red:    { iconBg: "bg-red-50 dark:bg-red-500/20",     iconColor: "text-red-600 dark:text-red-400" },
  amber:  { iconBg: "bg-amber-50 dark:bg-amber-500/20",   iconColor: "text-amber-600 dark:text-amber-400" },
  gray:   { iconBg: "bg-gray-100 dark:bg-white/10",   iconColor: "text-gray-600 dark:text-gray-400" },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = "blue",
}: StatCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <div className="bg-white dark:bg-[hsl(220,10%,20%)] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none truncate">{value}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                trend.direction === "up"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
      <div className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${colors.iconBg}`}>
        <Icon className={`w-5 h-5 ${colors.iconColor}`} />
      </div>
    </div>
  );
}
