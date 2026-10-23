"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api-client";
import { PublicCourseSummary } from "@insight-ignite/shared";

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ courses: PublicCourseSummary[] }>("/courses");
      setCourses(res.courses || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load course catalog. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const res = await apiFetch<{ courses: PublicCourseSummary[] }>("/courses");
        if (isMounted) {
          setCourses(res.courses || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load course catalog. Please check your connection."
          );
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F5EFE8] to-[#FAF8F5] border-b border-[#E7DFD4]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Learning Academy"
              title="Online Courses & Masterclasses"
              subtitle="Evidence-informed, self-paced learning journeys designed by Dr. Nivedita Ganguli for parents, educators, and developmental mentors."
            />
          </div>
        </section>

        {/* Catalog Body */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl border border-[#E3D8CC] p-8 animate-pulse shadow-xs"
                  >
                    <div className="h-6 bg-[#EFE8DF] rounded-md w-1/3 mb-4" />
                    <div className="h-4 bg-[#EFE8DF] rounded-md w-2/3 mb-2" />
                    <div className="h-4 bg-[#EFE8DF] rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div
                role="alert"
                className="bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto text-xl font-bold">
                  !
                </div>
                <h3 className="font-serif text-xl font-bold text-[#2D241E]">
                  Unable to Load Catalog
                </h3>
                <p className="text-sm text-[#6B5A4E] max-w-md mx-auto">{error}</p>
                <Button onClick={fetchCatalog} variant="primary">
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
              <div className="bg-white rounded-3xl border border-[#E3D8CC] p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#FAF5EE] text-[#8C5E42] flex items-center justify-center mx-auto text-2xl font-serif">
                  ✦
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2D241E]">
                  No Courses Currently Published
                </h3>
                <p className="text-sm text-[#6B5A4E] max-w-md mx-auto">
                  New masterclasses and developmental programs are currently in institutional review. Please check back soon or register your interest with our mentorship team.
                </p>
                <Link
                  href="/contact"
                  className="inline-block px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
                >
                  Contact Admissions
                </Link>
              </div>
            )}

            {/* Populated Catalog */}
            {!loading && !error && courses.length > 0 && (
              <div className="space-y-8">
                {courses.map((course) => (
                  <article
                    key={course.id}
                    className="bg-white rounded-3xl border border-[#E3D8CC] shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-5 bg-gradient-to-br from-[#8C5E42] to-[#5C3925] p-8 text-[#FDFBF7] flex flex-col justify-between">
                        <div className="space-y-3">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                            Masterclass
                          </span>
                          <h2 className="font-serif text-2xl font-bold leading-tight">
                            {course.title}
                          </h2>
                          {course.subtitle && (
                            <p className="text-xs text-white/85 leading-relaxed">
                              {course.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/20 text-xs space-y-1.5 text-white/80">
                          <div>
                            Instructor:{" "}
                            <strong className="text-white">{course.instructor}</strong>
                          </div>
                          <div>
                            Curriculum:{" "}
                            <strong className="text-white">
                              {course.lessonCount} Structured Modules
                            </strong>
                          </div>
                          <div>
                            Format:{" "}
                            <strong className="text-white">Online Self-Paced</strong>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-serif text-lg font-bold text-[#2D241E]">
                            Course Overview
                          </h3>
                          <p className="text-sm text-[#5C4D42] leading-relaxed line-clamp-4">
                            {course.description}
                          </p>
                          <div className="p-3.5 rounded-xl bg-[#FAF6F1] border border-[#EBE1D6] text-xs text-[#524338]">
                            <strong>Status:</strong> Published & Enrolling for Online Study.
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                          <Link
                            href={`/courses/${course.slug}`}
                            className="w-full sm:w-auto text-center px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors"
                          >
                            View Full Syllabus & Details &rarr;
                          </Link>
                          <Link
                            href="/contact"
                            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-sm hover:bg-[#F2ECE4] transition-colors"
                          >
                            Inquire with Mentorship Team
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="mt-12 text-center text-sm text-[#6B5A4E]">
              More courses for adolescents and educators are on the way.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
