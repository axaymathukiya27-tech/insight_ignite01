import React from "react";

export const metadata = {
  title: "My Portal",
};

// The portal frame (navigation, account menu, sign-in check) lives in ../layout.tsx
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
