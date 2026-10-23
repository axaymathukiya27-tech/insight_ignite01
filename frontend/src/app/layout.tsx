import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Insight Ignite — Educational & Developmental Mentorship | Dr. Nivedita Ganguli",
    template: "%s | Insight Ignite",
  },
  description:
    "Official educational and developmental mentorship platform led by Dr. Nivedita Ganguli. Evidence-informed frameworks across parenting and families, adolescent mentorship, educator pedagogy, and organizational resilience.",
  keywords: [
    "Insight Ignite",
    "Dr. Nivedita Ganguli",
    "Educational Mentorship",
    "Conscious Parenting",
    "Adolescent Development",
    "Educator Training",
    "Emotional Resilience",
    "The 6 Powers of Conscious Parenting",
  ],
  authors: [{ name: "Dr. Nivedita Ganguli" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#FAF8F5] text-[#2D241E] font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
