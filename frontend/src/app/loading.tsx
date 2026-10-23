import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5]">
      <div className="w-12 h-12 rounded-full border-3 border-[#8C5E42]/20 border-t-[#8C5E42] animate-spin mb-4" />
      <p className="font-serif text-sm font-semibold text-[#5C4D42] tracking-wide">
        Loading Insight Ignite...
      </p>
    </div>
  );
}
