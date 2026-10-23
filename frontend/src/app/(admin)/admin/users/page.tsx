import React from "react";

export default function AdminUsersPage() {
  const sampleUsers = [
    {
      id: "usr-1",
      name: "Dr. Nivedita Ganguli",
      email: "nivedita@insightignite.org",
      role: "Lead Educator & Admin",
      joined: "Oct 2026",
    },
    {
      id: "usr-2",
      name: "Administrative Secretariat",
      email: "info@insightignite.org",
      role: "Platform Coordinator",
      joined: "Oct 2026",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
          User Management
        </h1>
        <p className="text-sm text-[#5C4D42]">
          Manage user profiles, role assignments, and permissions across parents, educators, and staff.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Assigned Role</th>
                <th className="py-4 px-6">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
              {sampleUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-4 px-6 font-semibold text-[#2D241E]">{u.name}</td>
                  <td className="py-4 px-6">{u.email}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] font-semibold border border-[#E4D8CB]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#7A6A5F]">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
