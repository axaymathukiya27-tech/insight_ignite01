import React from "react";

interface Props {
  current: number;
  total: number;
  factorName?: string;
  factorTagline?: string | null;
  /** When set, shows "{current} of {total} {label}" instead of "Question X of Y". */
  label?: string;
}

export default function ProgressBar({
  current,
  total,
  factorName,
  factorTagline,
  label,
}: Props) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-3" role="region" aria-label="Assessment Progress">
      <div className="flex items-center justify-between text-xs text-[#6B5A4E]">
        <span className="font-semibold tracking-wide uppercase text-[#8C5E42]">
          {label ? `${current} of ${total} ${label}` : `Question ${current} of ${total}`}
        </span>
        <span className="font-medium text-[#7C6A5E]">{percentage}% Complete</span>
      </div>

      <div
        className="h-2 w-full bg-[#EADFD5] rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Assessment progress: ${percentage}%`}
      >
        <div
          className="h-full bg-[#8C5E42] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {factorName && (
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C5E42] font-semibold border border-[#E8DFD5]">
            {factorName}
          </span>
          {factorTagline && (
            <span className="text-[#8A796E] truncate hidden sm:inline">
              — {factorTagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
