import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { claimAssessment } from "../api";

interface Props {
  claimToken: string;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: () => void;
}

export default function ClaimModal({
  claimToken,
  isOpen,
  onClose,
  onClaimSuccess,
}: Props) {
  const { user, isAuthenticated, login, register } = useAuth();
  const [tab, setTab] = useState<"claim" | "login" | "register">(
    isAuthenticated ? "claim" : "register"
  );

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaimDirect = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await claimAssessment(claimToken);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onClaimSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to claim assessment result.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await login({ email, password });
      const res = await claimAssessment(claimToken);
      if (res.success) {
        setSuccessMessage("Signed in and saved reflection to your profile!");
        setTimeout(() => {
          onClaimSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication or claiming failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await register({ name: fullName, email, password, role: "PARENT" });
      // After registration, user must verify email per auth system
      // We can notify them that after signing in, their token will be linked
      setSuccessMessage(
        "Account created! Please verify your email, then sign in to complete saving your reflection."
      );
      setTimeout(() => {
        onClaimSuccess();
        onClose();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E3D8CC] shadow-xl space-y-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8A796E] hover:text-[#2D241E] p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8C5E42]">
            Account Security
          </span>
          <h2
            id="claim-modal-title"
            className="font-serif text-2xl font-bold text-[#2D241E]"
          >
            Save Reflection to Profile
          </h2>
          <p className="text-xs text-[#6B5A4E]">
            Securely link your anonymous assessment report to keep it permanently.
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] space-y-1"
          >
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#166534] font-medium"
          >
            ✓ {successMessage}
          </div>
        )}

        {/* Direct Claim for Logged-In Users */}
        {isAuthenticated && user ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE4D8] text-xs space-y-1">
              <span className="text-[#8A796E]">Currently signed in as:</span>
              <div className="font-bold text-[#2D241E] text-sm">
                {user.fullName || user.email}
              </div>
              <div className="text-[#6B5A4E]">{user.email}</div>
            </div>

            <button
              type="button"
              onClick={handleClaimDirect}
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? "Linking..." : "Confirm & Save to My Account"}
            </button>
          </div>
        ) : (
          /* Unauthenticated: Register or Sign In */
          <div className="space-y-4 pt-1">
            <div className="flex border-b border-[#EDE4D8] text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 transition-colors ${
                  tab === "register"
                    ? "text-[#8C5E42] border-b-2 border-[#8C5E42]"
                    : "text-[#8A796E] hover:text-[#2D241E]"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setErrorMessage(null);
                }}
                className={`flex-1 pb-2.5 transition-colors ${
                  tab === "login"
                    ? "text-[#8C5E42] border-b-2 border-[#8C5E42]"
                    : "text-[#8A796E] hover:text-[#2D241E]"
                }`}
              >
                Sign In
              </button>
            </div>

            {tab === "register" ? (
              <form onSubmit={handleRegisterAndClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3D34] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                    placeholder="Parent name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A3D34] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A3D34] mb-1">
                    Password (8+ chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account & Save Reflection"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginAndClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3D34] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                    placeholder="parent@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A3D34] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D5C7B8] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In & Save Reflection"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
