"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Read return destination safely (prevent open redirects)
  const returnParam = searchParams.get("returnTo");
  const verifiedNotice = searchParams.get("verified");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);
    setLoading(true);

    try {
      const user = await login({ email, password });

      // Determine safe redirect destination
      let destination = "/learn";
      if (user.role === "PLATFORM_ADMIN" || user.role === "SCHOOL_ADMIN") {
        destination = "/admin";
      }

      if (returnParam && returnParam.startsWith("/") && !returnParam.startsWith("//")) {
        destination = returnParam;
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setErrorCode(err.code);
      } else {
        setErrorMessage("Unable to connect to authentication service. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
          Learner Portal
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5A4E]">
          Log in to access your courses, journals, and progress.
        </p>
      </div>

      {verifiedNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed"
        >
          Your email address has been verified successfully. You may now sign in.
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
        >
          <p>{errorMessage}</p>
          {errorCode === "EMAIL_NOT_VERIFIED" && (
            <p className="mt-2 font-semibold">
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                className="text-[#8C5E42] underline hover:text-[#724B34]"
              >
                Resend verification email &rarr;
              </Link>
            </p>
          )}
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full justify-center"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </Button>
      </form>

      <div className="pt-4 border-t border-[#EFE8DF] text-center text-xs text-[#6B5A4E]">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/register"
          className="font-bold text-[#8C5E42] hover:text-[#724B34] underline"
        >
          Create Account
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<Card className="p-8 text-center text-xs text-[#7A6A5E]">Loading login...</Card>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
