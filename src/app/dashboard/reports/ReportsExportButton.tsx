"use client";

import { Download } from "lucide-react";

interface ReportsExportButtonProps {
  tab: string;
  from: string;
  to: string;
  data: unknown[];
}

export default function ReportsExportButton({ tab, from, to, data }: ReportsExportButtonProps) {
  function exportCSV() {
    if (!data.length) return;

    const headers = Object.keys(data[0] as object).filter(
      (k) => typeof (data[0] as Record<string, unknown>)[k] !== "object"
    );

    const rows = (data as Record<string, unknown>[]).map((row) =>
      headers.map((h) => {
        const val = row[h];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "");
      }).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymflow-${tab}-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCSV}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </button>
  );
}
