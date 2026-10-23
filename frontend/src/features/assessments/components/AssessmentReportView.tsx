import React from "react";
import Link from "next/link";
import { AssessmentResultDto, AreaSummaryDto } from "@insight-ignite/shared";
import { buildReportModel, DimensionTone } from "../report-model";

interface Props {
  result: AssessmentResultDto;
  onOpenClaimModal?: () => void;
}

const BADGE: Record<DimensionTone, string> = {
  strength: "bg-[#EBF5EE] text-[#1E562F] border-[#C8E6D0]",
  growth: "bg-[#FEF6EC] text-[#9A4F13] border-[#F7DBBE]",
  steady: "bg-[#FAF5EE] text-[#8C5E42] border-[#E8DFD5]",
  neutral: "bg-[#FAF5EE] text-[#8C5E42] border-[#E8DFD5]",
};

const BAR: Record<DimensionTone, string> = {
  strength: "bg-[#2E6F40]",
  growth: "bg-[#B45309]",
  steady: "bg-[#8C5E42]",
  neutral: "bg-[#8C5E42]",
};

function ScoreLine({ area }: { area: AreaSummaryDto }) {
  if (area.percentage === undefined) return null;
  return (
    <p className="text-xs font-semibold text-[#5C4D42]">
      Score: {area.percentage}%{area.band ? ` · ${area.band}` : ""}
      {area.direction === "HIGHER_IS_CONCERN" ? " · lower is better on this dimension" : ""}
    </p>
  );
}

export default function AssessmentReportView({ result, onOpenClaimModal }: Props) {
  const model = buildReportModel(result);

  return (
    <div className="report-root max-w-4xl mx-auto my-8 px-4 sm:px-6 space-y-8">
      {/* Anonymous Guest Warning / Save Banner (not printed) */}
      {result.isAnonymous && onOpenClaimModal && (
        <div className="print:hidden bg-[#FAF5EE] rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#8C5E42]/10 text-[#8C5E42] text-xs font-semibold">
              Guest Session (30-Day Retention)
            </span>
            <h3 className="font-serif text-xl font-bold text-[#2D241E]">
              Save Your Reflection to Your Profile
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4D42] max-w-xl">
              Anonymous reports are automatically removed after 30 days. Link this reflection permanently to an account to track your progress over time.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenClaimModal}
            className="px-6 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
          >
            Save to Profile &rarr;
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-8 print:border-0 print:shadow-none print:p-0">
        {/* 1. Parenting Growth Summary */}
        <section className="report-section space-y-5" aria-labelledby="summary-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8DF] pb-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#8C5E42]">
                Insight Ignite · Self-Reflection Profile
              </span>
              <h1 id="summary-heading" className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E]">
                Your Parenting Growth Summary
              </h1>
              <p className="text-xs text-[#8A796E]">
                Completed on {model.completedDate} • Assessment version {model.versionNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden px-4 py-2 rounded-full border border-[#D5C7B8] text-[#5C4D42] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              Print / Save PDF
            </button>
          </div>

          <p className="text-sm sm:text-base text-[#3E3127] leading-relaxed">{model.summary}</p>

          <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-[#EDE4D8] flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#8C5E42] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              i
            </div>
            <div className="text-xs text-[#5C4D42] leading-relaxed">
              <span className="font-semibold text-[#2D241E]">Educational self-reflection: </span>
              {model.disclaimer}
            </div>
          </div>

          {model.isLegacy && (
            <div role="note" className="p-4 rounded-2xl bg-[#FEF6EC] border border-[#F7DBBE] text-xs text-[#8C3D04] leading-relaxed">
              This report was calculated before Insight Ignite recorded each dimension&apos;s scoring direction. On dimensions where a higher score means a more frequent concerning behaviour, the labels and sections below may not be accurate. Please treat it with care or retake the assessment.
            </div>
          )}
        </section>

        {/* 2. Growth Dimension Breakdown */}
        <section className="report-section space-y-5 pt-4 border-t border-[#EFE8DF]" aria-labelledby="breakdown-heading">
          <div className="space-y-1">
            <h2 id="breakdown-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
              Growth Dimension Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5A4E]">
              Each bar shows your score as you answered it. Read the note under each dimension: on some dimensions a lower score is the positive result.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.dimensions.map((d) => (
              <div
                key={d.code}
                data-dimension={d.code}
                data-classification={d.classification ?? "UNKNOWN"}
                className="report-card p-5 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-serif font-bold text-base text-[#2D241E]">{d.name}</span>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${BADGE[d.tone]}`}>
                    {d.band}
                  </span>
                </div>

                <div className="space-y-1">
                  <div
                    className="h-2 w-full bg-[#E5DCD1] rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={d.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${d.name}: ${d.percentage}%`}
                  >
                    <div className={`h-full rounded-full ${BAR[d.tone]}`} style={{ width: `${d.percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[#8A796E]">
                    <span>{d.direction === "HIGHER_IS_CONCERN" ? "How often (lower is better)" : "Score"}</span>
                    <span className="font-bold text-[#4A3D34]">{d.percentage}%</span>
                  </div>
                </div>

                {d.interpretation && (
                  <p className="text-xs text-[#3E3127] leading-relaxed">{d.interpretation}</p>
                )}
                {d.description && (
                  <p className="text-xs text-[#6B5A4E] leading-relaxed">
                    <span className="font-semibold">What this measures: </span>
                    {d.description}
                  </p>
                )}
                {!d.interpretation && d.bandDescription && (
                  <p className="text-xs text-[#6B5A4E] leading-relaxed">{d.bandDescription}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Your Foundational Strengths */}
        <section className="report-section space-y-4 pt-4 border-t border-[#EFE8DF]" aria-labelledby="strengths-heading">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2E6F40]">What you are doing well</span>
            <h2 id="strengths-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
              Your Foundational Strengths
            </h2>
          </div>
          {model.strengths.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]">
              None of the dimensions reached the strength range this time. That is common and gives you a clear starting point below.
            </p>
          ) : (
            <div className="space-y-4">
              {model.strengths.map((s) => (
                <div key={s.factorCode} data-section="strength" data-dimension={s.factorCode} className="report-card p-5 rounded-2xl bg-[#F6FAF7] border border-[#D5EAD9] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2E6F40] text-white flex items-center justify-center text-xs font-bold">✓</span>
                    <h3 className="font-serif font-bold text-base text-[#1E562F]">{s.factorName}</h3>
                  </div>
                  <ScoreLine area={s} />
                  <p className="text-xs sm:text-sm text-[#3E6548] leading-relaxed">{s.description}</p>
                  {s.whyItMatters && (
                    <p className="text-xs sm:text-sm text-[#3E6548] leading-relaxed">
                      <span className="font-semibold">Why this is a strength: </span>
                      {s.whyItMatters}
                    </p>
                  )}
                  {s.actionableHabit && (
                    <div className="mt-2 p-3 rounded-xl bg-white/80 border border-[#D5EAD9] text-xs text-[#2A4E32]">
                      <span className="font-semibold">To keep it going: </span>
                      {s.actionableHabit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Your Areas for Growth */}
        <section className="report-section space-y-4 pt-4 border-t border-[#EFE8DF]" aria-labelledby="growth-heading">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">What you can work on next</span>
            <h2 id="growth-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
              Your Areas for Growth
            </h2>
          </div>
          {model.growthAreas.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]">
              None of the dimensions fell in the growth range this time.
            </p>
          ) : (
            <div className="space-y-4">
              {model.growthAreas.map((g) => (
                <div key={g.factorCode} data-section="growth" data-dimension={g.factorCode} className="report-card p-5 rounded-2xl bg-[#FFF9F2] border border-[#F3DFC9] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#B45309] text-white flex items-center justify-center text-xs font-bold">↑</span>
                    <h3 className="font-serif font-bold text-base text-[#8C3D04]">{g.factorName}</h3>
                  </div>
                  <ScoreLine area={g} />
                  <p className="text-xs sm:text-sm text-[#6E421E] leading-relaxed">{g.description}</p>
                  {g.behaviorFocus && (
                    <p className="text-xs sm:text-sm text-[#6E421E] leading-relaxed">
                      <span className="font-semibold">What could benefit from attention: </span>
                      {g.behaviorFocus}
                    </p>
                  )}
                  {(g.actions?.length ?? 0) > 0 ? (
                    <div className="mt-2 p-3 rounded-xl bg-white/80 border border-[#F3DFC9] text-xs text-[#6E421E] space-y-1">
                      <span className="font-semibold">Things you can try:</span>
                      <ul className="list-disc list-inside space-y-1">
                        {g.actions!.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    g.actionableHabit && (
                      <div className="mt-2 p-3 rounded-xl bg-white/80 border border-[#F3DFC9] text-xs text-[#6E421E]">
                        <span className="font-semibold">Something you can try: </span>
                        {g.actionableHabit}
                      </div>
                    )
                  )}
                  {g.example && (
                    <p className="text-xs text-[#6E421E] italic leading-relaxed">
                      <span className="font-semibold not-italic">In everyday life: </span>
                      {g.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {model.steadyAreas.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                Developing: neither a clear strength nor a priority
              </h3>
              {model.steadyAreas.map((s) => (
                <div key={s.factorCode} data-section="steady" data-dimension={s.factorCode} className="report-card p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] space-y-1">
                  <p className="font-serif font-bold text-sm text-[#2D241E]">{s.factorName}</p>
                  <ScoreLine area={s} />
                  <p className="text-xs text-[#5C4D42] leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Personalized Recommendations */}
        <section className="report-section space-y-4 pt-4 border-t border-[#EFE8DF]" aria-labelledby="recommendations-heading">
          <h2 id="recommendations-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
            Personalized Recommendations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {model.recommendations.map((r) => (
              <div key={`${r.kind}-${r.factorCode}`} data-section={`recommendation-${r.kind}`} data-dimension={r.factorCode} className="report-card p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] space-y-2">
                <p className="font-semibold text-sm text-[#2D241E]">{r.heading}</p>
                <ul className="list-disc list-inside text-xs text-[#5C4D42] space-y-1">
                  {r.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {model.courses.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">Courses that can help</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {model.courses.map((rec) => (
                  <div key={rec.courseId} className="report-card p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-lg text-[#2D241E]">{rec.title}</h4>
                      {rec.subtitle && <p className="text-xs text-[#6B5A4E] line-clamp-2">{rec.subtitle}</p>}
                      {rec.relevanceReason && <p className="text-xs text-[#8A796E] italic">{rec.relevanceReason}</p>}
                    </div>
                    <Link
                      href={`/courses/${rec.slug}`}
                      className="print:hidden inline-block text-center px-4 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
                    >
                      View Course Details &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 6. Your Next Steps */}
        <section className="report-section space-y-4 pt-4 border-t border-[#EFE8DF]" aria-labelledby="next-steps-heading">
          <h2 id="next-steps-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
            Your Next Steps
          </h2>
          {model.nextSteps.length > 0 ? (
            <ol className="space-y-2">
              {model.nextSteps.map((step, i) => (
                <li key={i} data-section="next-step" className="flex gap-3 text-sm text-[#3E3127] leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#8C5E42] text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[#6B5A4E]">Revisit this reflection in a few weeks to notice what has changed.</p>
          )}
          <p className="text-xs text-[#8A796E] leading-relaxed">
            Choose one step for this week. Small, repeated changes in everyday moments matter more than big efforts.
          </p>
        </section>
      </div>
    </div>
  );
}
