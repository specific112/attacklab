import type { Metadata } from "next";

const siteUrl = "https://attacklab.vercel.app";

export const metadata: Metadata = {
  title: "Cybersecurity Courses — 30 Learning Paths from Beginner to Advanced",
  description:
    "Browse 30 structured cybersecurity courses: Linux, Networking, OWASP Top 10, Burp Suite, Nmap, Metasploit, Wireshark, Active Directory, Bug Bounty Hunting, and more. Free to start.",
  openGraph: {
    title: "Cybersecurity Courses | ATTACKLAB",
    description: "30 structured courses from beginner to professional. Learn ethical hacking, penetration testing, and bug bounty hunting.",
    url: `${siteUrl}/courses`,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ATTACKLAB Cybersecurity Courses" }],
  },
  alternates: {
    canonical: "/courses",
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
