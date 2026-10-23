"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api-client";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  message: "",
};

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState("parenting");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          phone: formData.phone || null,
          organization: formData.organization || null,
          inquiryType,
        }),
      });
      setSent(true);
      setFormData(emptyForm);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== 0
          ? err.message
          : "We couldn't send your message right now. Please try again, or email info@insightignite.org."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Connect & Inquire"
              title="Get in Touch with Dr. Nivedita Ganguli"
              subtitle="Whether you are an individual parent seeking course guidance, an educator requesting school mentorship, or an organization planning a workshop, we look forward to hearing from you."
            />
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Direct Info & Institutional Guidelines */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-sm space-y-6">
                <h3 className="font-serif text-2xl font-bold text-[#2D241E]">
                  Direct Inquiries
                </h3>
                <p className="text-sm text-[#5C4D42] leading-relaxed">
                  The Insight Ignite mentorship secretariat reviews all requests carefully. For academic partnerships and institutional workshops, please include your organization name and proposed timeline.
                </p>

                <div className="space-y-4 pt-2 border-t border-[#EFE8DF] text-sm">
                  <div>
                    <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                      Secretariat Email
                    </span>
                    <p className="font-semibold text-[#8C5E42] mt-0.5">
                      info@insightignite.org
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                      Office Hours
                    </span>
                    <p className="text-[#3E3127] mt-0.5">
                      Monday &ndash; Friday, 9:00 AM &ndash; 5:00 PM IST
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
                      Mentorship Head Office
                    </span>
                    <p className="text-[#3E3127] mt-0.5">
                      Insight Ignite Developmental Programs, India
                    </p>
                  </div>
                </div>
              </div>

              {/* Consultation Policy Card */}
              <div className="bg-[#FAF5EE] rounded-3xl p-7 border border-[#E3D8CC] text-xs text-[#5C4D42] space-y-3">
                <div className="font-bold text-[#2D241E] text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8C5E42]"></span>
                  Professional Mentorship Note
                </div>
                <p className="leading-relaxed">
                  Insight Ignite provides educational guidance, pedagogical mentoring, and reflective parenting programs. Communications sent through this form do not establish a clinical therapy relationship. For urgent psychiatric emergencies, please contact your local healthcare providers.
                </p>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] shadow-sm space-y-6">
                {sent && (
                  <div
                    role="status"
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 leading-relaxed"
                  >
                    <p className="font-semibold">Thank you, your message has been received.</p>
                    <p>We will reply to your email as soon as we can.</p>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 leading-relaxed"
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-2">
                        Area of Interest / Program
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: "parenting", label: "Parenting & 6 Powers Course" },
                          { id: "adolescent", label: "Student & Adolescent Mentorship" },
                          { id: "schools", label: "Educator & School Programs" },
                          { id: "corporate", label: "Corporate Training & Leadership" },
                        ].map((option) => (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => setInquiryType(option.id)}
                            className={`p-3 rounded-xl border text-left font-medium transition-all ${
                              inquiryType === option.id
                                ? "border-[#8C5E42] bg-[#FAF5EE] text-[#8C5E42] font-semibold"
                                : "border-[#E4D8CD] bg-white text-[#5C4D42] hover:bg-[#FAF8F5]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                        >
                          Full Name *
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                        >
                          Email Address *
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                        >
                          Phone Number (Optional)
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="organization"
                          className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                        >
                          School / Organization (Optional)
                        </label>
                        <input
                          id="organization"
                          type="text"
                          value={formData.organization}
                          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          placeholder="School or company name"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42] mb-1.5"
                      >
                        Message or Inquiry Details *
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your needs, cohort size, or specific questions..."
                        className="w-full px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full justify-center"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
