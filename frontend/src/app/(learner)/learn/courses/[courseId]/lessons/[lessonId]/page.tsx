import React from "react";
import Link from "next/link";

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonDetailPage({ params }: Props) {
  const { courseId, lessonId } = await params;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Lesson Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/learn/courses/${courseId}`}
          className="text-xs font-semibold text-[#8C5E42] hover:underline"
        >
          &larr; Back to Modules
        </Link>
        <span className="text-xs text-[#7B6A5F] capitalize">
          Module: {lessonId.replace(/-/g, " ")}
        </span>
      </div>

      {/* Video & Media Area */}
      <div className="bg-black/90 rounded-3xl aspect-video w-full flex flex-col items-center justify-center text-center p-8 text-white space-y-3 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-white/30 transition-all">
          ▶
        </div>
        <p className="font-serif text-lg font-bold">
          Dr. Nivedita Ganguli — Guided Lecture
        </p>
        <p className="text-xs text-white/70 max-w-md">
          Phase 1 Media Player Preview: Video streaming CDN integration active during live cohort deployment.
        </p>
      </div>

      {/* Lesson Details & Practice Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
              Lesson Overview
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#2D241E]">
              Core Principles & Somatic Anchors
            </h1>
          </div>

          <div className="text-sm text-[#57483D] leading-relaxed space-y-4">
            <p>
              In this session, Dr. Ganguli guides parents through the physiology of relational presence. Before addressing your child&apos;s behavior, take a 30-second breath anchor to shift your nervous system from sympathetic alarm into calm parasympathetic safety.
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E5DACD] text-xs text-[#6B5A4E] space-y-2">
              <span className="font-bold text-[#2D241E] uppercase tracking-wider">
                Daily Reflection Prompt:
              </span>
              <p>
                &ldquo;Where in your body did you feel defensive during today&apos;s interactions with your child? What would happen if you paused for 10 seconds before replying?&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Resources & Handouts Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#2D241E]">
              Lesson Downloads
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8DEC7] flex items-center justify-between">
                <span className="font-medium text-[#4A3C32]">Module Worksheet (.PDF)</span>
                <span className="text-[#8C5E42] font-semibold cursor-pointer">Download</span>
              </li>
              <li className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8DEC7] flex items-center justify-between">
                <span className="font-medium text-[#4A3C32]">Audio Meditation (.MP3)</span>
                <span className="text-[#8C5E42] font-semibold cursor-pointer">Listen</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
