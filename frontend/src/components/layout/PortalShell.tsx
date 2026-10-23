"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PortalNavItem, ROLE_LABEL, isActive, navForRole } from "@/config/portal-nav";

interface Props {
  variant: "parent" | "admin";
  nav: PortalNavItem[];
  homeHref: string;
  children: React.ReactNode;
}

const THEME = {
  parent: {
    header: "bg-white/95 backdrop-blur-md border-b border-[#E3D8CC] text-[#2D241E]",
    badge: "bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]",
    badgeText: "My Portal",
    link: "text-[#5C4D42] hover:text-[#2D241E] hover:bg-[#FAF5EE]",
    active: "text-[#2D241E] bg-[#F3EADF]",
    subtle: "text-[#5C4D42] hover:text-[#2D241E] border-[#E3D8CC] hover:bg-[#FAF5EE]",
    avatar: "bg-[#E8DDD2] text-[#6D4C37]",
    body: "bg-[#FAF8F5]",
  },
  admin: {
    header: "bg-[#2D241E] border-b border-[#40342B] text-white",
    badge: "bg-[#8C5E42] text-white",
    badgeText: "Admin Console",
    link: "text-white/75 hover:text-white hover:bg-white/10",
    active: "text-white bg-white/15",
    subtle: "text-white/85 hover:text-white border-white/25 hover:bg-white/10",
    avatar: "bg-[#8C5E42] text-white",
    body: "bg-[#F6F4F0]",
  },
} as const;

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5z" />
    </svg>
  );
}

/**
 * Shared frame for the signed-in parent portal and the admin console: branding, the
 * role-specific navigation with the current page marked, a clearly labelled way back to
 * the public website, a profile menu with logout, and a mobile menu. Authentication and
 * role checks stay in the layouts and, above all, in the backend.
 */
export default function PortalShell({ variant, nav, homeHref, children }: Props) {
  const t = THEME[variant];
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = navForRole(nav, user?.role);
  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || "?";

  const closeMenus = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };
  // Close menus on outside click / Escape (links close them on click)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className={`min-h-screen flex flex-col ${t.body} text-[#2D241E]`} data-portal={variant}>
      <header className={`sticky top-0 z-40 print:hidden ${t.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link href={homeHref} className="flex items-center gap-2 shrink-0" aria-label={`Insight Ignite ${t.badgeText}`}>
              <span className="font-serif text-lg font-bold">Insight Ignite</span>
              <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.badge}`}>
                {t.badgeText}
              </span>
            </Link>

            <nav aria-label={`${t.badgeText} navigation`} className="hidden lg:flex items-center gap-1 text-xs font-semibold">
              {items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    onClick={closeMenus}
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`px-3 py-2 rounded-lg transition-colors ${active ? t.active : t.link}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
                    onClick={closeMenus}
              href="/"
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${t.subtle}`}
            >
              <GlobeIcon />
              Visit website
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A27E] ${t.avatar}`}
              >
                {initial}
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-[#2D241E] border border-[#E3D8CC] shadow-lg py-2 text-sm"
                >
                  <div className="px-4 py-2 border-b border-[#F0E8DE]">
                    <p className="font-semibold truncate">{user?.fullName}</p>
                    <p className="text-xs text-[#8A796E] truncate">{user?.email}</p>
                    {user?.role && <p className="text-[11px] text-[#8C5E42] mt-0.5">{ROLE_LABEL[user.role] || user.role}</p>}
                  </div>
                  <Link role="menuitem" onClick={closeMenus} href={homeHref} className="block px-4 py-2 hover:bg-[#FAF5EE]">
                    {variant === "admin" ? "Admin overview" : "My dashboard"}
                  </Link>
                  <Link role="menuitem" onClick={closeMenus} href="/profile" className="block px-4 py-2 hover:bg-[#FAF5EE]">
                    Profile &amp; settings
                  </Link>
                  <Link role="menuitem" onClick={closeMenus} href="/" className="flex items-center gap-2 px-4 py-2 hover:bg-[#FAF5EE]">
                    <GlobeIcon /> Visit website
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-[#9F1239] hover:bg-[#FFF1F2] border-t border-[#F0E8DE] mt-1"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={`lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg ${t.link}`}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="portal-mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                {mobileOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav id="portal-mobile-nav" aria-label={`${t.badgeText} navigation`} className="lg:hidden border-t border-black/10 px-4 pb-4 pt-2 space-y-1">
            {items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                    onClick={closeMenus}
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-3 py-3 rounded-lg text-sm font-semibold ${active ? t.active : t.link}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/" onClick={closeMenus} className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold ${t.link}`}>
              <GlobeIcon /> Visit website
            </Link>
          </nav>
        )}
      </header>

      <div className="flex-grow">{children}</div>
    </div>
  );
}
