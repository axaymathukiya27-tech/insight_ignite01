"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSimulated(false);
    setLoading(true);

    try {
      const res = await apiFetch<{ success: boolean; message: string; simulated?: boolean }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatusMessage(res.message || "If that email exists in our records, password reset instructions have been sent.");
      if (res.simulated) {
        setIsSimulated(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Network error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="p-8 sm:p-10 space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
                Account Recovery
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
                Reset Password
              </h1>
              <p className="text-xs sm:text-sm text-[#6B5A4E]">
                Enter your account email and we&apos;ll send you instructions to reset your password.
              </p>
            </div>

            {statusMessage && (
              <div
                role="status"
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isSimulated
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {isSimulated && <p className="font-bold mb-1">Development Notice</p>}
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50 disabled:opacity-60"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading || !email}
                className="w-full justify-center"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="pt-4 border-t border-[#EFE8DF] text-center text-xs text-[#6B5A4E]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-bold text-[#8C5E42] hover:text-[#724B34] underline"
              >
                Sign In
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
