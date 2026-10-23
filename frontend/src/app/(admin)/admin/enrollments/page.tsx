import React from "react";

export const metadata = {
  title: "Enrollment Management — Admin Portal",
};

export default function AdminEnrollmentsPage() {
  const enrollments = [
    {
      id: "enr-1",
      userName: "Demo Parent Learner",
      email: "learner@insightignite.org",
      course: "The 6 Powers of Conscious Parenting",
      enrolledAt: "2026-10-15",
      progressPct: 35,
      status: "Active",
    },
    {
      id: "enr-2",
      userName: "Family Caregiver",
      email: "caregiver@example.com",
      course: "The 6 Powers of Conscious Parenting",
      enrolledAt: "2026-10-18",
      progressPct: 15,
      status: "Active",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
            Enrollment Records
          </h1>
          <p className="text-sm text-[#5C4D42]">
            View active course participants, enrollment timestamps, and completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#EAE3D9] text-[#78543B] text-xs font-semibold">
            Total Active: {enrollments.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Learner Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Course</th>
                <th className="py-4 px-6">Enrolled Date</th>
                <th className="py-4 px-6">Progress</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-4 px-6 font-semibold text-[#2D241E]">
                    {enr.userName}
                  </td>
                  <td className="py-4 px-6 text-[#5C4D42]">{enr.email}</td>
                  <td className="py-4 px-6">{enr.course}</td>
                  <td className="py-4 px-6 text-[#7A6A5E]">{enr.enrolledAt}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#EFE8DF] rounded-full h-2">
                        <div
                          className="bg-[#8C5E42] h-2 rounded-full"
                          style={{ width: `${enr.progressPct}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[11px] text-[#2D241E]">
                        {enr.progressPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] font-semibold border border-[#E4D8CB]">
                      {enr.status}
                    </span>
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
