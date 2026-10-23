import React from "react";
import Link from "next/link";
import {
  AssessmentResultDto,
  FactorScoreDto,
  AreaSummaryDto,
  AssessmentRecommendationDto,
} from "@insight-ignite/shared";

interface Props {
  result: AssessmentResultDto;
  onOpenClaimModal?: () => void;
}

export default function AssessmentReportView({
  result,
  onOpenClaimModal,
}: Props) {
  const completedDate = new Date(result.completedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const factorScores = Object.values(result.factorScores || {}) as FactorScoreDto[];

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 sm:px-6 space-y-8">
      {/* Anonymous Guest Warning / Save Banner */}
      {result.isAnonymous && onOpenClaimModal && (
        <div className="bg-[#FAF5EE] rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* Main Report Header */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8DF] pb-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#8C5E42]">
              Self-Reflection Profile
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E]">
              Your Parenting Growth Summary
            </h1>
            <p className="text-xs text-[#8A796E]">
              Completed on {completedDate} • Version {result.versionNumber}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-full border border-[#D5C7B8] text-[#5C4D42] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Educational Disclaimer Banner */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-[#EDE4D8] flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#8C5E42] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            i
          </div>
          <div className="text-xs text-[#5C4D42] leading-relaxed">
            <span className="font-semibold text-[#2D241E]">Professional Disclaimer: </span>
            {result.disclaimer}
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-6 pt-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
              Growth Dimension Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5A4E]">
              These scores reflect your self-reported tendencies in daily parenting interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factorScores.map((factor) => {
              const isStrength = factor.percentage >= 75;
              const isGrowth = factor.percentage < 50;

              return (
                <div
                  key={factor.factorCode}
                  className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-base text-[#2D241E]">
                      {factor.factorName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isStrength
                          ? "bg-[#EBF5EE] text-[#1E562F] border-[#C8E6D0]"
                          : isGrowth
                          ? "bg-[#FEF6EC] text-[#9A4F13] border-[#F7DBBE]"
                          : "bg-[#FAF5EE] text-[#8C5E42] border-[#E8DFD5]"
                      }`}
                    >
                      {factor.band}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-[#E5DCD1] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isStrength
                            ? "bg-[#2E6F40]"
                            : isGrowth
                            ? "bg-[#B45309]"
                            : "bg-[#8C5E42]"
                        }`}
                        style={{ width: `${factor.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#8A796E]">
                      <span>Alignment Score</span>
                      <span className="font-bold text-[#4A3D34]">{factor.percentage}%</span>
                    </div>
                  </div>

                  {factor.summaryText && (
                    <p className="text-xs text-[#6B5A4E] leading-relaxed pt-1">
                      {factor.summaryText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Foundational Strengths */}
        {result.strengths.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFE8DF]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2E6F40]">
                Core Pillars
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                Your Foundational Strengths
              </h2>
            </div>

            <div className="space-y-4">
              {result.strengths.map((str: AreaSummaryDto) => (
                <div
                  key={str.factorCode}
                  className="p-5 rounded-2xl bg-[#F6FAF7] border border-[#D5EAD9] space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2E6F40] text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#1E562F]">
                      {str.title || str.factorName}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#3E6548] leading-relaxed">
                    {str.description}
                  </p>
                  {str.actionableHabit && (
                    <div className="mt-2 p-3 rounded-xl bg-white/80 border border-[#D5EAD9] text-xs text-[#2A4E32]">
                      <span className="font-semibold">Nurturing Practice: </span>
                      {str.actionableHabit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities for Growth */}
        {result.growthAreas.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFE8DF]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                Gentle Awareness
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                Opportunities for Growth
              </h2>
            </div>

            <div className="space-y-4">
              {result.growthAreas.map((growth: AreaSummaryDto) => (
                <div
                  key={growth.factorCode}
                  className="p-5 rounded-2xl bg-[#FFF9F2] border border-[#F3DFC9] space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#B45309] text-white flex items-center justify-center text-xs font-bold">
                      ↑
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#8C3D04]">
                      {growth.title || growth.factorName}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6E421E] leading-relaxed">
                    {growth.description}
                  </p>
                  {growth.actionableHabit && (
                    <div className="mt-2 p-3 rounded-xl bg-white/80 border border-[#F3DFC9] text-xs text-[#6E421E]">
                      <span className="font-semibold">Reflective Practice: </span>
                      {growth.actionableHabit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Masterclasses (Published Only) */}
        {result.recommendedCourses && result.recommendedCourses.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[#EFE8DF]">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8C5E42]">
                Curated Learning Pathways
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                Recommended Masterclasses for Your Growth
              </h2>
              <p className="text-xs sm:text-sm text-[#6B5A4E]">
                Based on your growth reflection, these structured courses offer practical frameworks for co-regulation and presence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {result.recommendedCourses.map((rec: AssessmentRecommendationDto) => (
                <div
                  key={rec.courseId}
                  className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD5] flex flex-col justify-between space-y-4 hover:border-[#8C5E42] transition-colors"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-[#8C5E42] uppercase tracking-wide">
                      {rec.matchingFactorCode ? `Aligned with your reflection` : "Featured"}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                      {rec.title}
                    </h3>
                    {rec.subtitle && (
                      <p className="text-xs text-[#6B5A4E] line-clamp-2">
                        {rec.subtitle}
                      </p>
                    )}
                    {rec.relevanceReason && (
                      <p className="text-xs text-[#8A796E] italic">
                        {rec.relevanceReason}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/courses/${rec.slug}`}
                    className="inline-block text-center px-4 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
                  >
                    View Course Details &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
