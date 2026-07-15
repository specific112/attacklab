import type { Metadata } from "next";
import { RoutePage } from "../../components/site";

const siteUrl = "https://attacklab.vercel.app";

const pageData: Record<
  string,
  { title: string; description: string; keywords?: string[] }
> = {
  learn: {
    title: "Learning Paths",
    description:
      "Structured, hands-on ethical hacking learning paths created by security practitioners. Master Kali Linux, web exploitation, API security, and more.",
    keywords: ["ethical hacking courses", "security learning paths", "penetration testing training"],
  },
  labs: {
    title: "Hands-On Security Labs",
    description:
      "Spin up isolated attack environments for practicing real-world exploitation safely. Hands-on labs for web, API, cloud, and network security.",
    keywords: ["security labs", "hacking labs", "practice environment", "cyber security labs"],
  },
  challenges: {
    title: "CTF Challenges",
    description:
      "Sharpen your security skills with scenario-driven CTF challenges across the modern attack surface. Web, API, and infrastructure challenges.",
    keywords: ["CTF challenges", "capture the flag", "security challenges", "hacking challenges"],
  },
  programs: {
    title: "Bug Bounty Programs",
    description:
      "High-signal directory of bug bounty programs with clear scopes, fair rewards, and responsive triage teams. Find your next target.",
    keywords: ["bug bounty programs", "responsible disclosure", "vulnerability rewards"],
  },
  features: {
    title: "Platform Features",
    description:
      "Everything you need to become dangerously good at offensive security — learning, labs, research workflows, and community in one platform.",
    keywords: ["security platform", "hacking platform features"],
  },
  reports: {
    title: "Vulnerability Reports",
    description:
      "Write reports that move security teams. Capture impact, evidence, and remediation with calm, structured clarity.",
    keywords: ["vulnerability report", "security report writing", "bug bounty report"],
  },
  certifications: {
    title: "Security Certifications",
    description:
      "Practical credentials that reflect what you can actually do. Prove your offensive security skills with ATTACKLAB certifications.",
    keywords: ["security certifications", "ethical hacking certification", "penetration testing cert"],
  },
  leaderboard: {
    title: "Researcher Leaderboard",
    description:
      "See the top security researchers pushing the frontier forward this month. Earn your place among the best.",
    keywords: ["security researcher rankings", "bug bounty leaderboard"],
  },
  pricing: {
    title: "Pricing",
    description:
      "Simple, transparent pricing. Start free and upgrade when the work asks for more. Explorer, Practitioner, and Collective plans.",
    keywords: ["security platform pricing", "hacking course pricing"],
  },
  faq: {
    title: "FAQ",
    description:
      "Frequently asked questions about ATTACKLAB — the ethical hacking platform for learning, practicing, and earning through security research.",
    keywords: ["attacklab faq", "security platform questions"],
  },
  blog: {
    title: "Blog",
    description:
      "Ideas, research, and hard-won lessons from the ATTACKLAB network. Practical guides on exploitation, reporting, and security careers.",
    keywords: ["security blog", "ethical hacking articles", "penetration testing blog"],
  },
  docs: {
    title: "Documentation",
    description:
      "Everything you need to get the most from ATTACKLAB. Getting started guides, learning paths, and report submission workflows.",
    keywords: ["attacklab documentation", "hacking platform guide"],
  },
  community: {
    title: "Community",
    description:
      "You don't get good alone. Join a global network of curious, generous security minds on ATTACKLAB.",
    keywords: ["security community", "ethical hacker network"],
  },
  careers: {
    title: "Careers",
    description:
      "Come build the calm. We are making the internet a little more resilient, one researcher at a time. Join the ATTACKLAB team.",
    keywords: ["security jobs", "cyber security careers", "attacklab jobs"],
  },
  about: {
    title: "About Us",
    description:
      "A safer internet starts with curiosity. ATTACKLAB gives talented people the room, tools, and opportunity to protect what matters.",
    keywords: ["about attacklab", "cyber security company", "ethical hacking platform"],
  },
  contact: {
    title: "Contact Us",
    description:
      "Get in touch with ATTACKLAB. Follow us on social media or reach out directly for partnerships, questions, or feedback.",
    keywords: ["contact attacklab", "security platform support"],
  },
  security: {
    title: "Security Policy",
    description:
      "ATTACKLAB security policy and responsible disclosure guidelines. Learn how we protect our platform and researchers.",
    keywords: ["security policy", "responsible disclosure"],
  },
};

export function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Metadata {
  const route = params.slug.join("/");
  const data = pageData[route] || {
    title: "ATTACKLAB",
    description:
      "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs and real-world attack simulations.",
  };

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    alternates: {
      canonical: `/${route}`,
    },
    openGraph: {
      title: `${data.title} | ATTACKLAB`,
      description: data.description,
      url: `${siteUrl}/${route}`,
      siteName: "ATTACKLAB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.title} | ATTACKLAB`,
      description: data.description,
    },
  };
}

export default function Page({ params }: { params: { slug: string[] } }) {
  const route = params.slug.join("/");
  const data = pageData[route];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data?.title || "ATTACKLAB",
    description: data?.description,
    url: `${siteUrl}/${route}`,
    publisher: {
      "@type": "Organization",
      name: "ATTACKLAB",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RoutePage route={route} />
    </>
  );
}
