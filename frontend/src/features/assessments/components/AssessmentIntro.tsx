import React, { useState } from "react";
import { PublicAssessmentInstrument } from "@insight-ignite/shared";
import { DEFAULT_CONSENT_NOTICE_VERSION } from "../api";

interface Props {
  instrument: PublicAssessmentInstrument;
  onConsentGiven: (consentNoticeVersion: string) => void;
}

export default function AssessmentIntro({ instrument, onConsentGiven }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStart = () => {
    if (!agreed) {
      setValidationError("Explicit informed consent is required to begin the reflection.");
      return;
    }
    setValidationError(null);
    onConsentGiven(DEFAULT_CONSENT_NOTICE_VERSION);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
            Parent Self-Reflection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E]">
            {instrument.title}
          </h1>
          {instrument.subtitle && (
            <p className="text-lg text-[#5C4D42] font-medium">
              {instrument.subtitle}
            </p>
          )}
          <p className="text-sm sm:text-base text-[#6B5A4E] leading-relaxed">
            {instrument.description}
          </p>
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] text-center space-y-1">
            <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wide">
              Format
            </span>
            <div className="text-lg font-serif font-bold text-[#2D241E]">
              {instrument.items.length} Reflection Prompts
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] text-center space-y-1">
            <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wide">
              Est. Time
            </span>
            <div className="text-lg font-serif font-bold text-[#2D241E]">
              3 – 5 Minutes
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] text-center space-y-1">
            <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wide">
              Access
            </span>
            <div className="text-lg font-serif font-bold text-[#2D241E]">
              Anonymous & Secure
            </div>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EDE4D8] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C5E42]">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Educational Self-Reflection Notice
          </div>
          <p className="text-xs text-[#5C4D42] leading-relaxed">
            {instrument.disclaimerText ||
              "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation. It is designed to support mindful awareness of parenting habits and co-regulation strengths."}
          </p>
        </div>

        {/* Informed Consent Checkbox Gate */}
        <div className="pt-2 border-t border-[#EFE8DF] space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked) setValidationError(null);
              }}
              className="mt-1 h-5 w-5 rounded border-[#C8B8A6] text-[#8C5E42] focus:ring-[#8C5E42]"
              id="consent-checkbox"
            />
            <div className="text-xs sm:text-sm text-[#4A3D34] leading-relaxed">
              <span className="font-semibold text-[#2D241E]">
                Informed Consent (Version: {DEFAULT_CONSENT_NOTICE_VERSION}):
              </span>{" "}
              I understand that this is an educational self-reflection exercise. I give my explicit consent to have my responses processed server-side to calculate growth areas and recommendations according to the platform privacy policy.
            </div>
          </label>

          {validationError && (
            <div
              role="alert"
              className="text-xs font-semibold text-[#B91C1C] flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleStart}
              disabled={!agreed}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] ${
                agreed
                  ? "bg-[#8C5E42] text-[#FDFBF7] hover:bg-[#724B34] shadow-sm cursor-pointer"
                  : "bg-[#E6DCD1] text-[#9A897D] cursor-not-allowed"
              }`}
            >
              Begin Self-Reflection &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
