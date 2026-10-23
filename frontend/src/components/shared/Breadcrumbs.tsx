import React from "react";
import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[#7B6A5F] flex items-center gap-2">
      <Link href="/" className="hover:text-[#2D241E] transition-colors">
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-[#C8B8AA]">&bull;</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-[#2D241E] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[#2D241E]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
