"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5] text-[#2D241E]">
      <div className="w-16 h-16 rounded-full bg-[#FAF0E6] flex items-center justify-center text-[#8C5E42] text-2xl font-bold mb-4">
        !
      </div>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
        Something unexpected occurred
      </h1>
      <p className="text-xs sm:text-sm text-[#6B5A4E] max-w-md mb-6 leading-relaxed">
        Our team has been notified. You can retry the current action or navigate safely back to the home page.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-xs hover:bg-[#F2ECE4] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
