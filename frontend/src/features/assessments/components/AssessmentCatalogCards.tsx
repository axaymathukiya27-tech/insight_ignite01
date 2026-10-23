import React from "react";
import Link from "next/link";
import type { ActiveAssessmentSummary } from "../api";

interface Props {
  assessments: ActiveAssessmentSummary[];
  compact?: boolean;
}

/**
 * Cards for every published self-assessment, each linking to /assessments/<slug>.
 */
export default function AssessmentCatalogCards({ assessments, compact = false }: Props) {
  return (
    <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2" : "md:grid-cols-2"} gap-5`}>
      {assessments.map((a) => (
        <article
          key={a.slug}
          className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm p-6 sm:p-7 flex flex-col gap-4"
        >
          <div className="space-y-2 flex-grow">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold">
              {a.questionCount} questions
            </span>
            <h3 className="font-serif text-xl font-bold text-[#2D241E]">{a.title}</h3>
            {a.subtitle && <p className="text-sm font-medium text-[#6B5A4E]">{a.subtitle}</p>}
            {!compact && (
              <p className="text-sm text-[#5C4D42] leading-relaxed line-clamp-4">{a.description}</p>
            )}
          </div>
          <Link
            href={`/assessments/${a.slug}`}
            className="self-start px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
          >
            Start &rarr;
          </Link>
        </article>
      ))}
    </div>
  );
}
