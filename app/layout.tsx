import type { Metadata } from "next";
import "./globals.css";
import "./cinematic.css";
import { CyberProvider } from "../components/cyber-provider";
import { AuthProvider } from "../components/auth-provider";

const siteUrl = "https://attacklab.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "ATTACKLAB — Ethical Hacking, Penetration Testing & Bug Bounty Platform",
    template: "%s | ATTACKLAB",
  },
  description:
    "Master ethical hacking, penetration testing, and bug bounty hunting through 30 structured courses, hands-on labs, CTF challenges, and real-world attack simulations. Free to start. Join 40,000+ security researchers.",
  keywords: [
    "ethical hacking",
    "penetration testing",
    "bug bounty",
    "cyber security course",
    "security research",
    "vulnerability assessment",
    "web exploitation",
    "API security",
    "red team",
    "Kali Linux",
    "security labs",
    "hacking courses online",
    "CTF challenges",
    "bug bounty programs",
    "offensive security",
    "learn cybersecurity",
    "hacking tutorial",
    "OWASP Top 10",
    "Burp Suite tutorial",
    "Nmap tutorial",
    "Metasploit course",
    "Wireshark tutorial",
    "Active Directory security",
    "privilege escalation",
    "password cracking",
    "wireless security",
    "cloud security",
    "mobile security",
    "OSINT",
    "reconnaissance",
    "post exploitation",
    "ethical hacking certification",
    "cybersecurity training",
    "bug bounty hunter",
    "security analyst",
  ],
  authors: [{ name: "ATTACKLAB", url: siteUrl }],
  creator: "ATTACKLAB",
  publisher: "ATTACKLAB",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ATTACKLAB",
    title: "ATTACKLAB — Ethical Hacking, Penetration Testing & Bug Bounty Platform",
    description:
      "Master ethical hacking through 30 structured courses, hands-on labs, CTF challenges, and bug bounty programs. Free to start.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ATTACKLAB — Ethical Hacking and Bug Bounty Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATTACKLAB — Ethical Hacking & Bug Bounty Platform",
    description:
      "Master ethical hacking through 30 courses, hands-on labs, and bug bounty programs. Free to start.",
    images: ["/og-image.png"],
    creator: "@mrspecific22",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google8f8ba8a740cf5e04",
  },
  other: {
    "theme-color": "#0a0a0f",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="msapplication-TileColor" content="#0a0a0f" />
        <link rel="canonical" href={siteUrl} />
      </head>
      <body>
        <AuthProvider>
          <CyberProvider>
            {children}
          </CyberProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
