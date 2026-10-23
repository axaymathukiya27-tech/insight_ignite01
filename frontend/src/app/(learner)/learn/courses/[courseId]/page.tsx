import React from "react";
import Link from "next/link";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function LearnerCourseRoomPage({ params }: Props) {
  const { courseId } = await params;

  const lessons = [
    {
      id: "power-1",
      number: "01",
      title: "The Power of Presence",
      duration: "45 mins",
      type: "Video & Somatic Reflection",
    },
    {
      id: "power-2",
      number: "02",
      title: "The Power of Attunement",
      duration: "50 mins",
      type: "Audio Guidance & Worksheet",
    },
    {
      id: "power-3",
      number: "03",
      title: "The Power of Clarity",
      duration: "40 mins",
      type: "Video & Boundary Templates",
    },
    {
      id: "power-4",
      number: "04",
      title: "The Power of Co-Regulation",
      duration: "55 mins",
      type: "Breathing Anchors & Case Studies",
    },
    {
      id: "power-5",
      number: "05",
      title: "The Power of Repair",
      duration: "45 mins",
      type: "Restorative Dialogue Framework",
    },
    {
      id: "power-6",
      number: "06",
      title: "The Power of Autonomy",
      duration: "40 mins",
      type: "Parental Separation & Trust",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Course Room Header */}
      <div className="bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/learn/courses"
            className="text-xs font-semibold text-[#8C5E42] hover:underline"
          >
            &larr; Back to My Courses
          </Link>
          <span className="text-[#C8B8AA]">&bull;</span>
          <span className="text-xs text-[#7B6A5F] capitalize">
            {courseId.replace(/-/g, " ")}
          </span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
          The 6 Powers of Conscious Parenting
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4D42] max-w-2xl leading-relaxed">
          Masterclass curated by Dr. Nivedita Ganguli. Select a power module below to view recorded lessons, download reflection worksheets, and submit self-study notes.
        </p>
      </div>

      {/* Lesson List */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#2D241E]">
          Course Modules
        </h2>

        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl p-5 border border-[#E3D8CC] shadow-sm hover:border-[#8C5E42]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#E3D8CC] flex items-center justify-center font-serif font-bold text-[#8C5E42] text-sm">
                  {lesson.number}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#2D241E]">
                    {lesson.title}
                  </h3>
                  <div className="text-xs text-[#7B6A5F] flex items-center gap-2 mt-0.5">
                    <span>{lesson.duration}</span>
                    <span>&bull;</span>
                    <span>{lesson.type}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
                className="px-5 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors self-start sm:self-auto"
              >
                Start Lesson &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
