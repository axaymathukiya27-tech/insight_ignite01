"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token || token.trim() === "") {
      setErrorMessage("Reset token is missing. Please click the link sent to your email.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), password }),
      });
      setSuccessMessage(res.message || "Password has been successfully updated. You may now sign in.");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to reset password. The link may have expired or is invalid.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <Card className="p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold">
          ✓
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
            Password Updated
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
            Reset Complete!
          </h1>
          <p className="text-sm text-[#5C4D42] leading-relaxed">
            {successMessage}
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-bold text-sm hover:bg-[#724B34] transition-colors text-center"
        >
          Proceed to Sign In
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
          Account Recovery
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
          Set New Password
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5A4E]">
          Please enter a secure password for your Insight Ignite learner account.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!tokenFromUrl && (
          <div>
            <label
              htmlFor="token"
              className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
            >
              Reset Token *
            </label>
            <input
              id="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the reset token from your email"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50 disabled:opacity-60"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
          >
            New Password *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7B6A5F] hover:text-[#2D241E] cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
          >
            Confirm New Password *
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50 disabled:opacity-60"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !password || !confirmPassword}
          className="w-full justify-center"
        >
          {loading ? "Updating Password..." : "Update Password"}
        </Button>
      </form>

      <div className="pt-4 border-t border-[#EFE8DF] text-center text-xs text-[#6B5A4E]">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-bold text-[#8C5E42] hover:text-[#724B34] underline"
        >
          Back to Sign In
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<Card className="p-8 text-center text-xs text-[#7A6A5E]">Loading reset form...</Card>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
