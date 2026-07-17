import type { Metadata } from "next";

const siteUrl = "https://attacklab.vercel.app";

export const metadata: Metadata = {
  title: "Cybersecurity Courses — 30 Levels from Beginner to Professional",
  description:
    "Browse 30 structured ethical hacking courses on ATTACKLAB — from Cybersecurity Fundamentals to Professional Penetration Testing. Hands-on labs, CTF challenges, and real-world attack simulations.",
  keywords: [
    "ethical hacking courses",
    "cybersecurity courses online",
    "penetration testing training",
    "bug bounty courses",
    "hacking courses free",
    "security certification",
  ],
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Cybersecurity Courses | ATTACKLAB",
    description:
      "30 structured ethical hacking courses from beginner to professional. Hands-on labs, CTF challenges, and real-world attack simulations.",
    url: `${siteUrl}/courses`,
    siteName: "ATTACKLAB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cybersecurity Courses | ATTACKLAB",
    description:
      "30 structured ethical hacking courses from beginner to professional.",
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
