import type { Metadata } from "next";
import "./globals.css";
import "./cinematic.css";
import { CyberProvider } from "../components/cyber-provider";

const siteUrl = "https://attacklab.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "ATTACKLAB — Ethical Hacking, Penetration Testing & Bug Bounty Platform",
    template: "%s | ATTACKLAB",
  },
  description:
    "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs, real-world attack simulations, and responsible vulnerability research. Join 40,000+ security researchers.",
  keywords: [
    "ethical hacking",
    "penetration testing",
    "bug bounty",
    "cyber security",
    "security research",
    "vulnerability assessment",
    "web exploitation",
    "API security",
    "red team",
    "Kali Linux",
    "security labs",
    "hacking courses",
    "CTF challenges",
    "bug bounty programs",
    "offensive security",
  ],
  authors: [{ name: "ATTACKLAB" }],
  creator: "ATTACKLAB",
  publisher: "ATTACKLAB",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ATTACKLAB",
    title: "ATTACKLAB — Ethical Hacking, Penetration Testing & Bug Bounty Platform",
    description:
      "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs, real-world attack simulations, and responsible vulnerability research.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ATTACKLAB — Ethical Hacking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATTACKLAB — Ethical Hacking Platform",
    description:
      "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs and real-world attack simulations.",
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
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body>
        <CyberProvider>
          {children}
        </CyberProvider>
      </body>
    </html>
  );
}
