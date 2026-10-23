import React from "react";

export default function AdminOrdersPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
          Orders & Transactions
        </h1>
        <p className="text-sm text-[#5C4D42]">
          Monitor course enrollments, cohort registrations, and payment receipts.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-sm text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#8C5E42] font-serif font-bold text-lg">
          ₹
        </div>
        <h3 className="font-serif font-bold text-lg text-[#2D241E]">
          Phase 1 Payment Gateway Integration
        </h3>
        <p className="text-xs text-[#5C4D42] max-w-md mx-auto leading-relaxed">
          The payment processing subsystem is configured with Razorpay/Stripe interfaces in the backend module. Live transactions will populate here upon public cohort launch.
        </p>
      </div>
    </main>
  );
}
