"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DateInput } from "@/components/ui/date-input";

interface Props {
  tab: string;
  fromDate: string;
  toDate: string;
}

export function ReportsDateFilter({ tab, fromDate, toDate }: Props) {
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ tab, from, to });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Desde</label>
        <DateInput
          value={from}
          onChange={setFrom}
          className="w-[145px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
        <DateInput
          value={to}
          onChange={setTo}
          className="w-[145px]"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
      >
        Filtrar
      </button>
    </form>
  );
}
