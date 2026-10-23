import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import LearningOutcomes from "@/features/home/components/LearningOutcomes";
import { PublicCourseDetail } from "@insight-ignite/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchCourse(slug: string): Promise<PublicCourseDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses/${slug}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.success ? (json.data.course as PublicCourseDetail) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  if (!course) {
    return {
      title: "Course Not Found",
    };
  }

  return {
    title: `${course.title}`,
    description: course.subtitle || course.description.slice(0, 150),
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-[#F3ECE4] via-[#F8F4EE] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EADFD4] text-[#634836] text-xs font-semibold tracking-wide">
                Masterclass Overview
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#2D241E] leading-tight max-w-3xl mx-auto">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-base sm:text-lg text-[#5F4E42] max-w-2xl mx-auto">
                  {course.subtitle}
                </p>
              )}
            </div>

            {/* Quick Details Bar */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-[#E3D7CB] shadow-sm text-center">
              <div>
                <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                  Instructor
                </span>
                <p className="font-serif font-bold text-[#2D241E] mt-0.5">
                  {course.instructor}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                  Format
                </span>
                <p className="font-serif font-bold text-[#2D241E] mt-0.5">
                  {course.lessons.length > 0
                    ? `${course.lessons.length} Core Modules`
                    : "Self-Paced Mentorship"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                  Language
                </span>
                <p className="font-serif font-bold text-[#2D241E] mt-0.5">English</p>
              </div>
              <div>
                <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                  Target Level
                </span>
                <p className="font-serif font-bold text-[#2D241E] mt-0.5">
                  Parents & Mentors
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Course Overview & Syllabus */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Overview */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D7CB] shadow-sm space-y-6">
            <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
              About This Masterclass
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-[#57483D] leading-relaxed whitespace-pre-line">
              <p>{course.description}</p>
              <p>
                Led by educator and mentor {course.instructor}, this course synthesizes foundational developmental principles into practical, repeatable practices for daily family life.
              </p>
            </div>
          </div>

          {/* Detailed Syllabus Modules */}
          {course.lessons.length > 0 && (
            <div className="space-y-8">
              <SectionHeading
                badge="Curriculum"
                title="Structured Modules & Lessons"
                subtitle="Each module provides foundational instruction, actionable somatic tools, real-life reflective guidance, and journal exercises."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E4D8CD] hover:border-[#8C5E42]/50 shadow-sm transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
                          Module {String(lesson.orderIndex).padStart(2, "0")}
                        </span>
                        {lesson.isFreePreview && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                            Free Preview
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-[#2D241E]">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs sm:text-sm text-[#615146] leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                      {lesson.durationMin && (
                        <div className="pt-2 text-[11px] text-[#8A796E]">
                          Duration: <strong>{lesson.durationMin} minutes</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Outcomes */}
          <LearningOutcomes />

          {/* Enrollment Notice & Pre-registration CTA */}
          <div className="rounded-3xl bg-gradient-to-br from-[#8C5E42] to-[#5C3925] text-[#FDFBF7] p-8 sm:p-12 text-center space-y-6 shadow-md">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                Enrollment & Registration
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                Join the Next Cohort
              </h2>
              <p className="text-sm text-white/90 leading-relaxed">
                Create an account or sign in to your Insight Ignite learner portal to access course materials, receive direct cohort announcements, and register your participation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-white text-[#5C3925] font-bold text-sm hover:bg-[#F3ECE4] transition-colors"
              >
                Create Learner Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3 rounded-full border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Sign In to Account
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/30 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors"
              >
                Inquire with Mentors
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
