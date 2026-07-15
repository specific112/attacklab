import { Home } from "../components/site";

const siteUrl = "https://attacklab.vercel.app";

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ATTACKLAB",
    url: siteUrl,
    description:
      "Master ethical hacking, penetration testing, and bug bounty hunting through immersive labs, real-world attack simulations, and responsible vulnerability research.",
    publisher: {
      "@type": "Organization",
      name: "ATTACKLAB",
      url: siteUrl,
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
      target: `${siteUrl}/api/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ATTACKLAB",
    url: siteUrl,
    description:
      "An elite platform for ethical hackers, penetration testers, and bug bounty hunters.",
    sameAs: [
      "https://x.com/mrspecific22",
      "https://github.com/specific112",
      "https://www.instagram.com/abdulafeezabdulsamad22",
      "https://www.youtube.com/@Hacker_specific",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "samadspecific112@gmail.com",
      contactType: "customer service",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Home />
    </>
  );
}
