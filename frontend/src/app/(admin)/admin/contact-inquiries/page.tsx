"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  parenting: "Parenting & 6 Powers",
  adolescent: "Students & Adolescents",
  schools: "Educators & Schools",
  corporate: "Corporate",
  general: "General",
};

export default function AdminContactInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<{ inquiries: Inquiry[] }>("/contact/admin")
      .then((res) => {
        if (active) setInquiries(res.inquiries || []);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load inquiries.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
            Contact Inquiries
          </h1>
          <p className="text-sm text-[#5C4D42]">
            Messages submitted from the public contact page.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#EAE3D9] text-[#78543B] text-xs font-semibold w-fit">
          Total: {inquiries.length}
        </span>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Organization</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Message</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7A6A5E]">Loading...</td>
                </tr>
              )}
              {!loading && inquiries.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#7A6A5E]">No inquiries yet.</td>
                </tr>
              )}
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-[#FAF8F5] align-top">
                  <td className="py-4 px-6 font-semibold text-[#2D241E] whitespace-nowrap">{inq.name}</td>
                  <td className="py-4 px-6 text-[#5C4D42]">
                    <a href={`mailto:${inq.email}`} className="hover:underline">{inq.email}</a>
                    {inq.phone && <div className="text-[#7A6A5E]">{inq.phone}</div>}
                  </td>
                  <td className="py-4 px-6 text-[#7A6A5E]">{inq.organization || "—"}</td>
                  <td className="py-4 px-6 font-medium text-[#8C5E42] whitespace-nowrap">
                    {typeLabels[inq.inquiryType] || inq.inquiryType}
                  </td>
                  <td className="py-4 px-6 text-[#5C4D42] max-w-sm whitespace-pre-line">{inq.message}</td>
                  <td className="py-4 px-6 text-[#7A6A5E] whitespace-nowrap">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                      {inq.status === "NEW" ? "New" : inq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
