"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();

  const dashboardHref = isAdmin ? siteConfig.links.adminDashboard : siteConfig.links.learnerDashboard;
  const initials = (user?.fullName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "Me";

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF8F5]/95 backdrop-blur-md shadow-xs border-b border-[#E7DFD5]"
          : "bg-[#FAF8F5] border-b border-[#EFE8DE]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] rounded-lg p-1"
            aria-label="Insight Ignite â€” Home"
          >
            <div className="w-10 h-10 rounded-full bg-[#8C5E42] flex items-center justify-center text-[#FDFBF7] shadow-xs group-hover:bg-[#724B34] transition-colors">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2v8" />
                <path d="m4.93 10.93 1.41 1.41" />
                <path d="M2 18h2" />
                <path d="M20 18h2" />
                <path d="m19.07 10.93-1.41 1.41" />
                <path d="M22 22H2" />
                <path d="m16 6-4 4-4-4" />
                <path d="M16 18a4 4 0 0 0-8 0" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#2D241E] group-hover:text-[#8C5E42] transition-colors">
                {siteConfig.name}
              </span>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[#7A6B5F]">
                {siteConfig.author}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-[#4A3E36]"
            aria-label="Main Navigation"
          >
            {siteConfig.navItems.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] ${
                    isActive
                      ? "text-[#8C5E42] font-semibold bg-[#F2EBE1]"
                      : "hover:text-[#8C5E42] hover:bg-[#F2EBE1]/60 text-[#4A3E36]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Account actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {loading ? (
              <div className="w-40 h-10" aria-hidden="true" />
            ) : isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#5A493D] hover:text-[#2D241E] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
                >
                  <span className="w-8 h-8 rounded-full bg-[#8C5E42] text-[#FDFBF7] flex items-center justify-center text-xs font-bold">
                    {initials}
                  </span>
                  <span className="hidden xl:inline">My Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-[#4A3C32] border border-[#D5C6B5] hover:bg-[#F2ECE4] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href={siteConfig.links.login}
                  className={`px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] rounded-md ${
                    pathname === siteConfig.links.login
                      ? "text-[#8C5E42]"
                      : "text-[#5A493D] hover:text-[#2D241E]"
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href={siteConfig.links.register}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-[#FDFBF7] bg-[#8C5E42] hover:bg-[#724B34] active:bg-[#5C3C29] rounded-full shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8C5E42]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#4A3E36] hover:bg-[#F0EAE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
              aria-controls="mobile-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden border-t border-[#E7DFD5] bg-[#FAF8F5] px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-col space-y-1">
            {siteConfig.navItems.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-base font-medium text-[#3D322A] hover:bg-[#F2EBE1] hover:text-[#8C5E42] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 border-t border-[#E7DFD5] flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-[#FDFBF7] bg-[#8C5E42] rounded-full hover:bg-[#724B34] transition-colors shadow-xs"
                >
                  My Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-[#4A3E36] border border-[#D5C7B8] rounded-full hover:bg-[#F0EAE0] transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href={siteConfig.links.login}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-[#4A3E36] border border-[#D5C7B8] rounded-full hover:bg-[#F0EAE0] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href={siteConfig.links.register}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 text-sm font-semibold text-[#FDFBF7] bg-[#8C5E42] rounded-full hover:bg-[#724B34] transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
