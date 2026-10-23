import React from "react";
import Link from "next/link";
import { AssessmentProgressDto, AssessmentResultDto, AreaSummaryDto } from "@insight-ignite/shared";
import { buildReportModel, DimensionTone, formatMinutes, formatPrice } from "../report-model";
import PracticePlanSection from "./PracticePlanSection";
import AssessmentProgressPanel from "./AssessmentProgressPanel";

interface Props {
  result: AssessmentResultDto;
  onOpenClaimModal?: () => void;
  // Optional pre-loaded history (otherwise the report loads it for signed-in owners)
  progress?: AssessmentProgressDto | null;
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

// Shape + word, so meaning never depends on colour alone
const ICON: Record<DimensionTone, string> = { strength: "✓", growth: "↑", steady: "◐", neutral: "•" };

function ScoreLine({ area }: { area: AreaSummaryDto }) {
  if (area.percentage === undefined) return null;
  return (
    <p className="text-xs font-semibold text-[#5C4D42]">
      Score: {area.percentage}%{area.band ? ` · ${area.band}` : ""}
      {area.direction === "HIGHER_IS_CONCERN" ? " · on this dimension, lower is better" : ""}
    </p>
  );
}

function Labeled({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function SectionHeading({ id, eyebrow, title, eyebrowClass = "text-[#8C5E42]" }: { id: string; eyebrow?: string; title: string; eyebrowClass?: string }) {
  return (
    <div className="space-y-1">
      {eyebrow && <span className={`text-xs font-semibold uppercase tracking-wider ${eyebrowClass}`}>{eyebrow}</span>}
      <h2 id={id} className="font-serif text-2xl font-bold text-[#2D241E]">
        {title}
      </h2>
    </div>
  );
}

export default function AssessmentReportView({ result, onOpenClaimModal, progress }: Props) {
  const model = buildReportModel(result);
  const retakeHref = model.instrumentSlug ? `/assessments/${model.instrumentSlug}` : "/assessments";

  return (
    <div className="report-root max-w-4xl mx-auto my-8 px-4 sm:px-6 space-y-8">
      {/* Anonymous Guest Warning / Save Banner (not printed) */}
      {result.isAnonymous && onOpenClaimModal && (
        <div className="print:hidden bg-[#FAF5EE] rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#8C5E42]/10 text-[#8C5E42] text-xs font-semibold">
              Guest Session (30-Day Retention)
            </span>
            <h3 className="font-serif text-xl font-bold text-[#2D241E]">Save Your Reflection to Your Profile</h3>
            <p className="text-xs sm:text-sm text-[#5C4D42] max-w-xl">
              Anonymous reports are automatically removed after 30 days. Save this reflection to an account to follow
              your seven-day plan and compare future attempts.
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

      <div className="bg-white rounded-3xl p-6 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-10 print:border-0 print:shadow-none print:p-0">
        {/* 1. Parenting Growth Summary */}
        <section className="report-section space-y-5" aria-labelledby="summary-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8DF] pb-6">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#8C5E42]">
                Insight Ignite · {result.instrumentTitle || "Self-Reflection Profile"}
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
              className="print:hidden self-start sm:self-auto px-4 py-2 rounded-full border border-[#D5C7B8] text-[#5C4D42] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              Print / Save PDF
            </button>
          </div>

          <p className="text-sm sm:text-base text-[#3E3127] leading-relaxed" data-section="summary">
            {model.summary}
          </p>

          {!model.isLegacy && model.counts.total > 0 && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-section="summary-counts">
              {[
                { label: "Dimensions assessed", value: model.counts.total },
                { label: "Strengths", value: model.counts.strengths },
                { label: "Areas for growth", value: model.counts.growth },
                { label: "Developing", value: model.counts.steady },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-[#FAF8F5] border border-[#EDE4D8] p-3">
                  <dt className="text-[11px] text-[#8A796E]">{c.label}</dt>
                  <dd className="font-serif text-2xl font-bold text-[#2D241E]">{c.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {model.nextAction && (
            <p className="text-xs sm:text-sm text-[#3E3127] leading-relaxed">
              <span className="font-semibold">Most useful next step: </span>
              {model.nextAction}
            </p>
          )}

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
              This report was calculated before Insight Ignite recorded each dimension&apos;s scoring direction. On
              dimensions where a higher score means a more frequent concerning behaviour, the labels and sections below
              may not be accurate. Please treat it with care or retake the assessment.
            </div>
          )}
        </section>

        {/* 2. Your Growth Dimension Breakdown */}
        <section className="report-section space-y-5" aria-labelledby="breakdown-heading">
          <div className="space-y-1">
            <h2 id="breakdown-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
              Your Growth Dimension Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5A4E]">
              Each bar shows your score as you answered. On some dimensions a lower score is the positive result; the
              note on each card says which.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.dimensions.map((d) => (
              <div
                key={d.code}
                data-dimension={d.code}
                data-classification={d.classification ?? "UNKNOWN"}
                className="report-card p-5 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] space-y-3 text-[#3E3127] min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-serif font-bold text-base text-[#2D241E] break-words min-w-0">{d.name}</span>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${BADGE[d.tone]}`}>
                    <span aria-hidden="true">{ICON[d.tone]} </span>
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
                    <span>{d.direction === "HIGHER_IS_CONCERN" ? "How often (lower is better)" : "Score (higher is better)"}</span>
                    <span className="font-bold text-[#4A3D34]">{d.percentage}%</span>
                  </div>
                </div>

                {d.measures && <Labeled label="What this measures">{d.measures}</Labeled>}
                {d.indicates && <Labeled label="What your score indicates">{d.indicates}</Labeled>}
                {d.practise && <Labeled label="What you can practise">{d.practise}</Labeled>}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Your Foundational Strengths */}
        <section className="report-section space-y-4" aria-labelledby="strengths-heading">
          <SectionHeading
            id="strengths-heading"
            title="Your Foundational Strengths — What You Are Doing Well"
          />
          {model.strengths.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]" data-section="no-strengths">
              This report has not identified a clear strength in the measured dimensions yet. That is common, and these
              results give you an honest starting point. The plan below builds from where you are now.
            </p>
          ) : (
            <div className="space-y-4">
              {model.strengths.map((s) => (
                <div key={s.factorCode} data-section="strength" data-dimension={s.factorCode} className="report-card p-5 rounded-2xl bg-[#F6FAF7] border border-[#D5EAD9] space-y-3 text-[#2A4E32]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2E6F40] text-white flex items-center justify-center text-xs font-bold" aria-hidden="true">✓</span>
                    <h3 className="font-serif font-bold text-base text-[#1E562F]">{s.factorName}</h3>
                  </div>
                  <ScoreLine area={s} />
                  {s.whatItMeasures && <Labeled label="What this measures">{s.whatItMeasures}</Labeled>}
                  <Labeled label="What you are doing well">{s.indicates || s.description}</Labeled>
                  {s.whyItMatters && <Labeled label="Why it matters">{s.whyItMatters}</Labeled>}
                  {s.actionableHabit && (
                    <div className="p-3 rounded-xl bg-white/80 border border-[#D5EAD9] text-xs sm:text-sm">
                      <span className="font-semibold">To build on it: </span>
                      {s.actionableHabit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Your Areas for Growth */}
        <section className="report-section space-y-4" aria-labelledby="growth-heading">
          <SectionHeading
            id="growth-heading"
            title="Your Areas for Growth — What You Can Work on Next"
          />
          {model.growthAreas.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]">None of the dimensions fell in the growth range this time.</p>
          ) : (
            <div className="space-y-4">
              {model.growthAreas.map((g) => (
                <div key={g.factorCode} data-section="growth" data-dimension={g.factorCode} className="report-card p-5 rounded-2xl bg-[#FFF9F2] border border-[#F3DFC9] space-y-3 text-[#6E421E]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center text-xs font-bold" aria-hidden="true">↑</span>
                    <h3 className="font-serif font-bold text-base text-[#8C3D04]">{g.factorName}</h3>
                  </div>
                  <ScoreLine area={g} />
                  {g.whatItMeasures && <Labeled label="What this measures">{g.whatItMeasures}</Labeled>}
                  <Labeled label="What your answers indicate">{g.indicates || g.description}</Labeled>
                  {g.behaviorFocus && <Labeled label="What you can practise">{g.behaviorFocus}</Labeled>}
                  {(g.actions?.length ?? 0) > 0 ? (
                    <div className="p-3 rounded-xl bg-white/80 border border-[#F3DFC9] text-xs sm:text-sm space-y-1">
                      <span className="font-semibold">Things you can try:</span>
                      <ul className="list-disc pl-5 space-y-1">
                        {g.actions!.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    g.actionableHabit && (
                      <div className="p-3 rounded-xl bg-white/80 border border-[#F3DFC9] text-xs sm:text-sm">
                        <span className="font-semibold">Something you can try: </span>
                        {g.actionableHabit}
                      </div>
                    )
                  )}
                  {g.example && <Labeled label="In everyday life"><span className="italic">{g.example}</span></Labeled>}
                  {g.smallGoal && (
                    <p className="text-xs sm:text-sm">
                      <span className="font-semibold">Your small goal: </span>
                      {g.smallGoal}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {model.steadyAreas.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                Developing: neither a clear strength nor a priority right now
              </h3>
              {model.steadyAreas.map((s) => (
                <div key={s.factorCode} data-section="steady" data-dimension={s.factorCode} className="report-card p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] space-y-1.5 text-[#3E3127]">
                  <p className="font-serif font-bold text-sm text-[#2D241E]">
                    <span aria-hidden="true">◐ </span>
                    {s.factorName}
                  </p>
                  <ScoreLine area={s} />
                  <p className="text-xs sm:text-sm leading-relaxed">{s.indicates || s.description}</p>
                  {s.actionableHabit && (
                    <p className="text-xs sm:text-sm leading-relaxed">
                      <span className="font-semibold">To keep developing: </span>
                      {s.actionableHabit}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Your Personalized Recommendations */}
        <section className="report-section space-y-4" aria-labelledby="recommendations-heading">
          <SectionHeading id="recommendations-heading" title="Your Personalized Recommendations" />
          {model.recommendations.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]">
              Personalized recommendations are available for reports calculated with the current scoring. Retake the
              assessment to receive them.
            </p>
          ) : (
            <div className="space-y-4">
              {model.recommendations.map((r) => (
                <div
                  key={`${r.kind}-${r.factorCode}`}
                  data-section={`recommendation-${r.kind}`}
                  data-dimension={r.factorCode}
                  className="report-card p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] space-y-3 text-[#3E3127]"
                >
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-[#8A796E]">Based on: {r.finding}</p>
                    <h3 className="font-serif font-bold text-base text-[#2D241E]">{r.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Labeled label="What to do">{r.what}</Labeled>
                    <Labeled label="When to try it">{r.when}</Labeled>
                    <Labeled label="How to try it">{r.how}</Labeled>
                    <Labeled label="What it could sound like"><span className="italic">{r.example}</span></Labeled>
                  </div>
                  <p className="text-xs text-[#6B5A4E]">
                    <span className="font-semibold">Why: </span>
                    {r.objective}
                    {r.planDays.length > 0 && ` Practised on day${r.planDays.length > 1 ? "s" : ""} ${r.planDays.join(", ")} of your plan.`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Your Seven-Day Parenting Practice Plan */}
        <section className="report-section space-y-4" aria-labelledby="plan-heading">
          <div className="space-y-1">
            <h2 id="plan-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
              Your Seven-Day Parenting Practice Plan
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5A4E]">
              One short exercise a day, starting with your main area for growth. Small, repeated changes in everyday
              moments matter more than big efforts. Completing the plan does not guarantee a particular result.
            </p>
          </div>
          <PracticePlanSection
            submissionId={result.submissionId}
            template={model.plan}
            canTrack={!result.isAnonymous}
            onOpenClaimModal={onOpenClaimModal}
          />
        </section>

        {/* 7. What to Do After Seven Days */}
        <section className="report-section space-y-3" aria-labelledby="after-heading">
          <h2 id="after-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
            What to Do After Seven Days
          </h2>
          <p className="text-sm text-[#3E3127] leading-relaxed">
            Look back at your notes and keep the practices that felt manageable. Then repeat this assessment to reflect
            on how your responses compare with this report. A retake creates a new report; this one is kept.
          </p>
          <p className="text-xs text-[#6B5A4E] leading-relaxed">
            You can retake the assessment at any time, but you may get more from it after finishing the practice week.
          </p>
          <Link
            href={retakeHref}
            className="print:hidden inline-block px-6 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
          >
            Retake Assessment
          </Link>
        </section>

        {/* 8. Your Assessment History and Progress (signed-in owners with earlier attempts) */}
        {!result.isAnonymous && model.instrumentSlug && (
          <AssessmentProgressPanel
            slug={model.instrumentSlug}
            variant="report"
            currentSubmissionId={result.submissionId}
            initial={progress}
          />
        )}

        {/* 9. Learning Resources */}
        <section className="report-section space-y-4" aria-labelledby="resources-heading">
          <SectionHeading id="resources-heading" title="Learning Resources That May Help You Grow" />
          {model.courses.length === 0 ? (
            <p className="text-sm text-[#6B5A4E]" data-section="no-courses">
              We are preparing learning resources to support your parenting journey. In the meantime, you can begin with
              your personalized seven-day practice plan.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {model.courses.map((rec) => {
                const price = formatPrice(rec.priceAmount, rec.currency);
                const duration = formatMinutes(rec.totalDurationMin);
                const facts = [
                  rec.lessonCount ? `${rec.lessonCount} lesson${rec.lessonCount === 1 ? "" : "s"}` : null,
                  duration,
                  price,
                ].filter(Boolean);
                return (
                  <div key={rec.courseId} data-course={rec.slug} className="report-card p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-lg text-[#2D241E]">{rec.title}</h3>
                      {rec.subtitle && <p className="text-xs text-[#6B5A4E]">{rec.subtitle}</p>}
                      {rec.relevanceReason && (
                        <p className="text-xs text-[#5C4D42]">
                          <span className="font-semibold">Why it relates to your results: </span>
                          {rec.relevanceReason}
                        </p>
                      )}
                      {facts.length > 0 && <p className="text-[11px] text-[#8A796E]">{facts.join(" · ")}</p>}
                      {rec.isEnrolled && <p className="text-[11px] font-semibold text-[#2E6F40]">You are already enrolled in this course.</p>}
                    </div>
                    <Link
                      href={`/courses/${rec.slug}`}
                      className="print:hidden inline-block text-center px-4 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
                    >
                      View course details &rarr;
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
