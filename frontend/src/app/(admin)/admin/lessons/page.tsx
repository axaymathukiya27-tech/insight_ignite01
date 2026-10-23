import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Lesson & Curriculum Management — Admin Portal",
};

export default function AdminLessonsPage() {
  const lessons = [
    {
      id: "lesson-1",
      orderIndex: 1,
      power: "Power 1: Presence & Somatic Grounding",
      title: "Cultivating Nervous-System Stability Before Responding",
      duration: "45 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
    {
      id: "lesson-2",
      orderIndex: 2,
      power: "Power 2: Clarity & Boundaries",
      title: "Establishing Shame-Free Non-Punitive Structure",
      duration: "50 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
    {
      id: "lesson-3",
      orderIndex: 3,
      power: "Power 3: Emotional Attunement",
      title: "Decoding Adolescent & Child Big Emotions",
      duration: "55 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
    {
      id: "lesson-4",
      orderIndex: 4,
      power: "Power 4: Compassionate Repair",
      title: "Restorative Apologies & Relational Trust Rebuilding",
      duration: "40 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
    {
      id: "lesson-5",
      orderIndex: 5,
      power: "Power 5: Conscious Communication",
      title: "Moving Beyond Reactive Lectures to Active Dialogue",
      duration: "50 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
    {
      id: "lesson-6",
      orderIndex: 6,
      power: "Power 6: Sustainable Rituals",
      title: "Daily Family Anchors for Enduring Connectedness",
      duration: "45 mins",
      status: "Published",
      course: "The 6 Powers of Conscious Parenting",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
            Curriculum & Lesson Management
          </h1>
          <p className="text-sm text-[#5C4D42]">
            Organize modules, video teachings, reflection worksheets, and sequence order.
          </p>
        </div>

        <Link
          href="/courses/the-6-powers-of-conscious-parenting"
          className="px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors self-start sm:self-auto"
        >
          View Public Course Syllabus
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Curriculum Module</th>
                <th className="py-4 px-6">Lesson Title</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-4 px-6 font-bold text-[#8C5E42]">
                    #{lesson.orderIndex}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#2D241E]">
                    {lesson.power}
                  </td>
                  <td className="py-4 px-6 text-[#5C4D42]">{lesson.title}</td>
                  <td className="py-4 px-6">{lesson.duration}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] font-semibold border border-[#E4D8CB]">
                      {lesson.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Link
                      href="/learn/courses/the-6-powers-of-conscious-parenting"
                      className="text-[#8C5E42] hover:text-[#724B34] font-semibold underline"
                    >
                      Preview
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
