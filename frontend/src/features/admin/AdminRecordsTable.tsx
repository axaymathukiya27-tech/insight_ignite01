"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  title: string;
  description: string;
  endpoint: string; // e.g. "/admin/platform/users"
  dataKey: string; // key of the array in the response
  rowKey: (row: T) => string;
  columns: Column<T>[];
  emptyMessage: string;
}

/** Read-only admin table of real records, with loading, empty, error and permission states. */
export default function AdminRecordsTable<T>({ title, description, endpoint, dataKey, rowKey, columns, emptyMessage }: Props<T>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<Record<string, T[]>>(endpoint)
      .then((res) => {
        if (active) setRows(res[dataKey] || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 403
            ? "Your account does not have permission to view this section."
            : "These records could not be loaded. Please refresh the page."
        );
      });
    return () => {
      active = false;
    };
  }, [endpoint, dataKey]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">{title}</h1>
        <p className="text-sm text-[#5C4D42]">{description}</p>
      </div>

      {error ? (
        <p role="alert" className="p-5 rounded-2xl bg-white border border-[#E3D8CC] text-sm text-[#9F1239]">
          {error}
        </p>
      ) : rows === null ? (
        <div className="h-40 rounded-3xl bg-white border border-[#E3D8CC] animate-pulse" role="status" aria-label="Loading" />
      ) : rows.length === 0 ? (
        <p className="p-8 rounded-3xl bg-white border border-[#E3D8CC] text-sm text-[#5C4D42] text-center">{emptyMessage}</p>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
                <tr>
                  {columns.map((c) => (
                    <th key={c.header} scope="col" className="py-3 px-4 sm:px-6 whitespace-nowrap">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
                {rows.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-[#FAF8F5]">
                    {columns.map((c) => (
                      <td key={c.header} className={`py-3 px-4 sm:px-6 ${c.className || ""}`}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-[11px] text-[#8A796E] border-t border-[#EFE8DF]">{rows.length} record(s)</p>
        </div>
      )}
    </main>
  );
}

export function formatDay(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "–";
}
