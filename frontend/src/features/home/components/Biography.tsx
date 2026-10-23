import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * Short founder introduction for the homepage. The full profile lives on /about.
 */
export default function Biography() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] border-b border-[#E7DDD0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="md:col-span-4 flex justify-center">
            <div className="w-full max-w-[260px] aspect-[4/5] rounded-3xl bg-gradient-to-b from-[#ECE3D8] to-[#DDD2C4] border border-[#D5C6B5] shadow-lg flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-[#8C5E42] text-[#FDFBF7] flex items-center justify-center font-serif text-3xl font-bold shadow-md mb-4">
                NG
              </div>
              <span className="font-serif text-lg font-bold text-[#3B2E24]">
                {siteConfig.author}
              </span>
              <span className="text-xs text-[#6F5F53] mt-1 font-medium">
                {siteConfig.authorTitle}
              </span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-5 text-center md:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EAE0D3] text-[#5C3E2A] text-xs font-semibold tracking-wide uppercase">
              Founder
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E] tracking-tight">
              Meet {siteConfig.author}
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#56473C]">
              {siteConfig.author} is dedicated to building supportive, mindful learning environments
              for children, schools, and families. Through {siteConfig.name}, she guides parents and
              educators toward deeper self-awareness, co-regulation, and compassionate clarity in
              everyday moments of challenge.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 font-semibold text-sm text-[#8C5E42] hover:text-[#724B34] transition-colors"
            >
              Read her full story &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
