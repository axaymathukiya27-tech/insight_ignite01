import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Educational Resources & Toolkits",
  description:
    "Curated reflection worksheets, parent-child conversation guides, and educator observation frameworks by Dr. Nivedita Ganguli.",
};

export default function ResourcesPage() {
  const resources = [
    {
      category: "Parenting & Reflection",
      title: "The Daily Attunement Check-in",
      format: "PDF Worksheet",
      description:
        "A 5-minute evening reflection worksheet to identify emotional triggers, celebrate small connections, and prepare for grounded morning interactions.",
      actionLabel: "View Resource Guide",
      badge: "Free Guide",
    },
    {
      category: "Adolescent Communication",
      title: "10 Conversation Openers for Teens",
      format: "Prompt Cards",
      description:
        "Non-interrogative question prompts designed to bypass adolescent defensive armor and invite genuine dialogue about peer dynamics, identity, and stress.",
      actionLabel: "View Resource Guide",
      badge: "Downloadable",
    },
    {
      category: "School & Classroom Mentorship",
      title: "Classroom Nervous System Observation Protocol",
      format: "Pedagogical Framework",
      description:
        "An objective rubric for educators and coordinators to spot sensory overload and cognitive fatigue in students before behavioral disruptions occur.",
      actionLabel: "View Resource Guide",
      badge: "Institutional Tool",
    },
    {
      category: "Family Harmony",
      title: "The Restorative Apology Template",
      format: "Family Handout",
      description:
        "A 4-step restorative dialogue structure for parents and children to repair emotional ruptures without shame, deflection, or lingering resentment.",
      actionLabel: "View Resource Guide",
      badge: "Free Guide",
    },
    {
      category: "Wellbeing & Stress",
      title: "Somatic De-escalation Micro-Practices",
      format: "Quick Reference Card",
      description:
        "Three physiological breathing techniques and sensory grounding anchors for parents and adolescents in the middle of emotional storms.",
      actionLabel: "View Resource Guide",
      badge: "Printable",
    },
    {
      category: "Executive & Professional Mentorship",
      title: "Psychological Safety in Team Environments",
      format: "Executive Whitepaper",
      description:
        "Dr. Nivedita Ganguli's principles on calm leadership presence, constructive conflict resolution, and preventing team burnout.",
      actionLabel: "View Resource Guide",
      badge: "Executive Brief",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Resource Center"
              title="Guides, Toolkits & Reflective Prompts"
              subtitle="Evidence-informed tools created by Dr. Nivedita Ganguli to anchor families, support students, and assist educational leaders."
            />
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((res, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-7 border border-[#E3D8CC] shadow-sm hover:shadow-md hover:border-[#8C5E42]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
                      {res.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#5C4D42] text-xs font-medium border border-[#E8DEC7]">
                      {res.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#2D241E] leading-snug">
                    {res.title}
                  </h3>

                  <p className="text-sm text-[#5C4D42] leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#EFE8DF] flex items-center justify-between">
                  <span className="text-xs text-[#8A796E] font-medium">{res.format}</span>
                  <Link
                    href="/contact"
                    className="text-xs font-bold text-[#8C5E42] hover:text-[#6E462F] flex items-center gap-1 transition-colors"
                  >
                    <span>Request Copy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Library Notice */}
          <div className="mt-16 bg-[#FAF5EE] border border-[#E5DACD] rounded-3xl p-8 sm:p-10 text-center max-w-3xl mx-auto space-y-4">
            <h4 className="font-serif text-xl font-bold text-[#2D241E]">
              Custom Resources for Schools & Organizations
            </h4>
            <p className="text-sm text-[#5C4D42] leading-relaxed">
              Dr. Ganguli collaborates directly with educational boards, parent associations, and corporate HR teams to synthesize customized mentorship handbooks and staff observation frameworks.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-block px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors"
              >
                Inquire About Custom Toolkits
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
