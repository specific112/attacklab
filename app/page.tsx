import { Home } from "../components/site";

const siteUrl = "https://attacklab.vercel.app";

export const metadata = {
  title: "ATTACKLAB — Ethical Hacking, Penetration Testing & Bug Bounty Platform",
  description:
    "Master ethical hacking, penetration testing, and bug bounty hunting through 30 structured courses, hands-on labs, and real-world attack simulations. Join 40,000+ security researchers on ATTACKLAB.",
  openGraph: {
    title: "ATTACKLAB — Ethical Hacking & Bug Bounty Platform",
    description:
      "Master ethical hacking through 30 structured courses, hands-on labs, CTF challenges, and bug bounty programs. Free to start.",
    url: siteUrl,
    siteName: "ATTACKLAB",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ATTACKLAB — Ethical Hacking Platform" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "ATTACKLAB — Ethical Hacking & Bug Bounty Platform",
    description:
      "Master ethical hacking through 30 courses, hands-on labs, and bug bounty programs.",
    images: ["/og-image.png"],
    creator: "@mrspecific22",
  },
};

export default function Page() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ATTACKLAB",
    alternateName: ["CYBER TITAN", "ATTACK LAB"],
    url: siteUrl,
    description:
      "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs, real-world attack simulations, and responsible vulnerability research.",
    publisher: {
      "@type": "Organization",
      name: "ATTACKLAB",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      sameAs: [
        "https://x.com/mrspecific22",
        "https://github.com/specific112",
        "https://www.instagram.com/abdulafeezabdulsamad22",
        "https://www.youtube.com/@Hacker_specific",
        "https://t.me/abdulsamad728828277",
      ],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/courses?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ATTACKLAB",
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    description:
      "An elite platform for ethical hackers, penetration testers, and bug bounty hunters. Offering 30 structured courses from beginner to advanced.",
    foundingDate: "2026",
    sameAs: [
      "https://x.com/mrspecific22",
      "https://github.com/specific112",
      "https://www.instagram.com/abdulafeezabdulsamad22",
      "https://www.youtube.com/@Hacker_specific",
      "https://t.me/abdulsamad728828277",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "samadspecific112@gmail.com",
      contactType: "customer service",
      availableLanguage: "English",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
    knowsAbout: [
      "Ethical Hacking",
      "Penetration Testing",
      "Bug Bounty Hunting",
      "Cybersecurity",
      "Web Application Security",
      "Network Security",
      "Kali Linux",
      "Burp Suite",
      "Nmap",
      "Metasploit",
      "Wireshark",
      "Active Directory",
      "OWASP Top 10",
      "OSINT",
      "Cloud Security",
      "Mobile Security",
      "API Security",
    ],
  };

  const courseCatalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ATTACKLAB Cybersecurity Courses",
    description: "Complete ethical hacking and cybersecurity learning path — 30 levels from beginner to professional.",
    numberOfItems: 30,
    itemListElement: [
      { "@type": "ListItem", position: 1, item: { "@type": "Course", name: "Cybersecurity Fundamentals", url: `${siteUrl}/courses/cybersecurity-fundamentals`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 2, item: { "@type": "Course", name: "Computer Networking", url: `${siteUrl}/courses/computer-networking`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 3, item: { "@type": "Course", name: "Linux Fundamentals", url: `${siteUrl}/courses/linux-fundamentals`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 4, item: { "@type": "Course", name: "Git & GitHub", url: `${siteUrl}/courses/git-github`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 5, item: { "@type": "Course", name: "Programming Fundamentals", url: `${siteUrl}/courses/programming-fundamentals`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 6, item: { "@type": "Course", name: "Web Technologies", url: `${siteUrl}/courses/web-technologies`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Computer Networking", educationalLevel: "Beginner" } },
      { "@type": "ListItem", position: 7, item: { "@type": "Course", name: "Linux Administration", url: `${siteUrl}/courses/linux-administration`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Linux Fundamentals", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 8, item: { "@type": "Course", name: "Windows Security", url: `${siteUrl}/courses/windows-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Cybersecurity Fundamentals", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 9, item: { "@type": "Course", name: "Networking Security", url: `${siteUrl}/courses/networking-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Computer Networking", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 10, item: { "@type": "Course", name: "OWASP Top 10", url: `${siteUrl}/courses/owasp-top-10`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Web Technologies", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 11, item: { "@type": "Course", name: "Web Application Security", url: `${siteUrl}/courses/web-application-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "OWASP Top 10", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 12, item: { "@type": "Course", name: "Burp Suite Mastery", url: `${siteUrl}/courses/burp-suite`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Web Application Security", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 13, item: { "@type": "Course", name: "Kali Linux Deep Dive", url: `${siteUrl}/courses/kali-linux-deep-dive`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Linux Fundamentals", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 14, item: { "@type": "Course", name: "Nmap Mastery", url: `${siteUrl}/courses/nmap-mastery`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Computer Networking", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 15, item: { "@type": "Course", name: "Metasploit Framework", url: `${siteUrl}/courses/metasploit-framework`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Kali Linux, Nmap", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 16, item: { "@type": "Course", name: "Wireshark Mastery", url: `${siteUrl}/courses/wireshark-mastery`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Computer Networking", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 17, item: { "@type": "Course", name: "Active Directory Security", url: `${siteUrl}/courses/active-directory-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Windows Security", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 18, item: { "@type": "Course", name: "Privilege Escalation", url: `${siteUrl}/courses/privilege-escalation`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Linux, Windows Security", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 19, item: { "@type": "Course", name: "Password Attacks", url: `${siteUrl}/courses/password-attacks`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Cybersecurity Fundamentals", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 20, item: { "@type": "Course", name: "Wireless Security", url: `${siteUrl}/courses/wireless-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Networking Security", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 21, item: { "@type": "Course", name: "Cloud Security", url: `${siteUrl}/courses/cloud-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Cybersecurity Fundamentals", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 22, item: { "@type": "Course", name: "Mobile Security", url: `${siteUrl}/courses/mobile-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Web Application Security", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 23, item: { "@type": "Course", name: "API Security", url: `${siteUrl}/courses/api-security`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Web Technologies, OWASP", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 24, item: { "@type": "Course", name: "OSINT Mastery", url: `${siteUrl}/courses/osint-mastery`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "None", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 25, item: { "@type": "Course", name: "Reconnaissance", url: `${siteUrl}/courses/reconnaissance`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Cybersecurity, Networking", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 26, item: { "@type": "Course", name: "Exploitation", url: `${siteUrl}/courses/exploitation`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Metasploit, Privilege Escalation", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 27, item: { "@type": "Course", name: "Post Exploitation", url: `${siteUrl}/courses/post-exploitation`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Exploitation", educationalLevel: "Advanced" } },
      { "@type": "ListItem", position: 28, item: { "@type": "Course", name: "Bug Bounty Hunting", url: `${siteUrl}/courses/bug-bounty-hunting`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Web App Security, Recon", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 29, item: { "@type": "Course", name: "Responsible Disclosure", url: `${siteUrl}/courses/responsible-disclosure`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Bug Bounty Hunting", educationalLevel: "Intermediate" } },
      { "@type": "ListItem", position: 30, item: { "@type": "Course", name: "Professional Penetration Testing", url: `${siteUrl}/courses/professional-pentesting`, provider: { "@type": "Organization", name: "ATTACKLAB" }, coursePrerequisites: "Exploitation, Post-Exploitation", educationalLevel: "Advanced" } },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is ATTACKLAB?", acceptedAnswer: { "@type": "Answer", text: "ATTACKLAB is an ethical hacking and bug bounty learning platform offering 30 structured courses from beginner to advanced, hands-on labs, CTF challenges, and bug bounty programs." } },
      { "@type": "Question", name: "Is ATTACKLAB free?", acceptedAnswer: { "@type": "Answer", text: "Yes, ATTACKLAB offers a free tier with access to basic courses and community features. Paid plans unlock advanced labs, certificates, and premium content." } },
      { "@type": "Question", name: "What courses does ATTACKLAB offer?", acceptedAnswer: { "@type": "Answer", text: "ATTACKLAB offers 30 levels covering: Cybersecurity Fundamentals, Linux, Networking, Programming, Web Technologies, OWASP Top 10, Burp Suite, Nmap, Metasploit, Wireshark, Active Directory, Privilege Escalation, Cloud Security, Mobile Security, API Security, OSINT, Bug Bounty Hunting, and Professional Penetration Testing." } },
      { "@type": "Question", name: "Do I get certificates after completing courses?", acceptedAnswer: { "@type": "Answer", text: "Yes, ATTACKLAB awards digital certificates and completion badges after successfully completing a course learning path, along with XP rewards." } },
      { "@type": "Question", name: "What is the bug bounty program?", acceptedAnswer: { "@type": "Answer", text: "ATTACKLAB provides a directory of bug bounty programs from companies like Vercel, Linear, and Raycast with rewards ranging from $500 to $25,000 for responsible vulnerability disclosure." } },
    ],
  };

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ATTACKLAB",
    operatingSystem: "Web",
    applicationCategory: "EducationalApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseCatalogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <Home />
    </>
  );
}
