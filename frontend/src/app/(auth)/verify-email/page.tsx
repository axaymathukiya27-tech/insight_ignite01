"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api-client";

// Tokens are single-use, so share one request per token. Without this, React's
// development double-mount sends the token twice and the second call fails.
const verificationRequests = new Map<string, Promise<unknown>>();

function verifyTokenOnce(token: string) {
  let request = verificationRequests.get(token);
  if (!request) {
    request = apiFetch<{ success: boolean; message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    verificationRequests.set(token, request);
  }
  return request;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const registeredEmail = searchParams.get("email") || "";
  const isRegisteredFlow = searchParams.get("registered") === "true";
  const isSimulatedFlow = searchParams.get("simulated") === "true";

  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState(registeredEmail);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isSimulatedDelivery, setIsSimulatedDelivery] = useState(isSimulatedFlow);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function performVerification() {
      setVerifying(true);
      setErrorMessage(null);
      try {
        await verifyTokenOnce(token!);
        if (isMounted) {
          setVerified(true);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("Unable to verify email. The link may have expired or is invalid.");
          }
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    performVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendStatus(null);
    setErrorMessage(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string; simulated?: boolean; verificationToken?: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: resendEmail }),
        }
      );
      setResendStatus(res.message || "A new verification link has been sent to your email.");
      if (res.simulated) {
        setIsSimulatedDelivery(true);
      }
      if (res.verificationToken) {
        window.location.href = `/verify-email?token=${encodeURIComponent(res.verificationToken)}`;
        return;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to resend verification email. Please try again later.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="p-8 sm:p-10 text-center space-y-6">
      {/* 1. In Progress State */}
      {verifying && (
        <div className="space-y-4 py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#8C5E42] text-2xl font-bold animate-pulse">
            ⏳
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2D241E]">
            Verifying Your Email...
          </h1>
          <p className="text-sm text-[#6B5A4E]">
            Please wait a moment while we validate your activation token.
          </p>
        </div>
      )}

      {/* 2. Success State */}
      {verified && (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold">
            ✓
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              Verification Complete
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
              Account Verified!
            </h1>
            <p className="text-sm text-[#5C4D42] leading-relaxed">
              Your email address has been successfully verified. You now have full access to your Insight Ignite learner portal.
            </p>
          </div>
          <Link
            href="/login?verified=true"
            className="block w-full py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-bold text-sm hover:bg-[#724B34] transition-colors text-center"
          >
            Sign In to Your Account
          </Link>
        </div>
      )}

      {/* 3. Error or Pending Flow State */}
      {!verifying && !verified && (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#8C5E42] text-2xl font-bold">
            ✉
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
              Account Activation
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
              {isRegisteredFlow ? "Check Your Inbox" : "Verify Your Email"}
            </h1>
            <p className="text-sm text-[#5C4D42] leading-relaxed">
              {isRegisteredFlow
                ? `We sent an activation link to ${registeredEmail || "your registered email address"}. Please click the link inside that email to confirm your account.`
                : "Enter your registered email address to request or resend an activation link."}
            </p>
          </div>

          {isSimulatedDelivery && (
            <div
              role="note"
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left leading-relaxed space-y-1"
            >
              <p className="font-bold">Development Simulation Mode</p>
              <p>
                Live SMTP credentials are not configured in this environment. The activation token has been generated and recorded in the server logs rather than delivered over the network.
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left leading-relaxed"
            >
              {errorMessage}
            </div>
          )}

          {resendStatus && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left leading-relaxed"
            >
              {resendStatus}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E4D8CB] text-xs text-[#6B5A4E] text-left space-y-2">
            <p className="font-semibold text-[#2D241E]">Didn&apos;t receive the email?</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Check your spam or promotions folder.</li>
              <li>Wait 1-2 minutes for mail delivery.</li>
              <li>Or request a fresh link using the form below.</li>
            </ul>
          </div>

          {/* Resend Form */}
          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <div>
              <label
                htmlFor="resendEmail"
                className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1"
              >
                Registered Email
              </label>
              <input
                id="resendEmail"
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={resending}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={resending || !resendEmail}
              className="w-full justify-center text-xs"
            >
              {resending ? "Sending Link..." : "Resend Verification Email"}
            </Button>
          </form>

          <div className="pt-2 border-t border-[#EFE8DF] flex justify-center">
            <Link
              href="/login"
              className="text-xs font-bold text-[#8C5E42] hover:underline"
            >
              Return to Login &rarr;
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<Card className="p-8 text-center text-xs text-[#7A6A5E]">Loading verification...</Card>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
