"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import CyberBackground from "./cyber-background";
import CyberOverlay from "./cyber-overlay";
import AICore from "./ai-core";
import { FaXTwitter, FaTiktok, FaGithub } from "react-icons/fa6";
import { FaInstagram, FaYoutube, FaTelegram } from "react-icons/fa";
import { SiGmail } from "react-icons/si";

const nav = [
  ["Learn", "/learn"], ["Programs", "/programs"], ["Labs", "/labs"], ["Challenges", "/challenges"], ["Community", "/community"]
];
const paths = ["Kali Linux", "Web Exploitation", "API Security", "Active Directory", "Cloud Security", "Red Team Ops"];
const programs = [
  ["Vercel", "$2,500\u2013$25,000", "94% response"],
  ["Linear", "$1,000\u2013$15,000", "4h triage"],
  ["Raycast", "$500\u2013$10,000", "92% response"]
];

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; kind: string; href: string }[]>([]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearch(true); }
      if (e.key === "Escape") setSearch(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() =>
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setResults(data.results ?? []))
        .catch(() => {}), 160);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  return (
    <>
      <CyberBackground />
      <CyberOverlay />
      <motion.header
        className="header"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Link className="brand" href="/"><i>◇</i> ATTACKLAB</Link>
        <nav>{nav.map(([n, u]) => <Link key={u} href={u} data-cyber="nav">{n}</Link>)}</nav>
        <div className="head-actions">
          <button className="search-button" onClick={() => setSearch(true)}>Search <kbd>⌘ K</kbd></button>
          <Link className="button tiny" href="/contact" data-cyber="cta">Contact <span>↗</span></Link>
          <button className="menu" aria-label="Open menu" onClick={() => setMenu(!menu)}>☰</button>
        </div>
      </motion.header>
      {menu && (
        <div className="mobile-nav">
          {nav.map(([n, u]) => <Link key={u} href={u} onClick={() => setMenu(false)}>{n}</Link>)}
          <Link href="/contact" onClick={() => setMenu(false)}>Contact</Link>
        </div>
      )}
      {search && (
        <div className="command" onClick={() => setSearch(false)}>
          <div className="command-box" onClick={e => e.stopPropagation()}>
            <span>⌕</span>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search labs, programs, docs\u2026" />
            <kbd>ESC</kbd>
            <div className="command-results">
              <small>{query ? "SEARCH RESULTS" : "QUICK NAVIGATION"}</small>
              {(query ? results : [{ title: "Contact", href: "/contact" }, { title: "Bug bounty programs", href: "/programs" }, { title: "Documentation", href: "/docs" }])
                .map(item => <Link key={item.href} href={item.href} onClick={() => setSearch(false)}>{item.title}<b>{"kind" in item ? item.kind : "↗"}</b></Link>)}
              {query && !results.length && <p className="empty-search">No exact signal found. Try &ldquo;labs&rdquo; or &ldquo;reports&rdquo;.</p>}
            </div>
          </div>
        </div>
      )}
      <Assistant />
    </>
  );
}

function Assistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("I'm ATTACK. I can point you to the right lab, learning path, or report workflow.");
  const [loading, setLoading] = useState(false);
  async function ask() {
    if (!message.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const data = await response.json();
      setReply(data.reply ?? "I couldn't reach the assistant. Please try again.");
      setMessage("");
    } finally { setLoading(false); }
  }
  return (
    <aside className="assistant-widget" data-cyber="assistant">
      <button className="assistant-trigger" onClick={() => setOpen(!open)} aria-label="Open ATTACK assistant">✦</button>
      {open && (
        <div className="assistant-panel">
          <div><span><i /> ATTACK</span><button onClick={() => setOpen(false)}>×</button></div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{reply}</motion.p>
          <div className="assistant-input">
            <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask ATTACK\u2026" />
            <button onClick={ask} disabled={loading}>{loading ? "\u2026" : "↑"}</button>
          </div>
        </div>
      )}
    </aside>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Link className="brand" href="/"><i>◇</i> ATTACKLAB</Link>
          <p>Ethical hacking, elevated.<br />Master the art of cyber offense.</p>
        </div>
        <div><b>Platform</b><Link href="/learn">Learning paths</Link><Link href="/labs">Labs</Link><Link href="/programs">Programs</Link><Link href="/leaderboard">Leaderboard</Link></div>
        <div><b>Resources</b><Link href="/blog">Blog</Link><Link href="/docs">Documentation</Link><Link href="/community">Community</Link><Link href="/careers">Careers</Link></div>
        <div><b>Company</b><Link href="/about">About</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link><Link href="/security">Security</Link></div>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2026 ATTACKLAB, INC.</span>
        <span style={{ color: "#aab0c0", textTransform: "uppercase", letterSpacing: ".045em" }}>
          <a href="mailto:samadspecific112@gmail.com">SAMADSPECIFIC112@GMAIL.COM</a>
        </span>
      </div>
    </footer>
  );
}

function FloatingScene() {
  return (
    <div className="scene">
      <AICore />
      <div className="scene-wall" />
      <div className="scene-floor" />
      <div className="scene-corner" />
      <div className="scene-ambient" />
    </div>
  );
}

export function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero cinematic-hero">
          <div className="orb one" /><div className="orb two" /><div className="grid-bg" />
          <div className="live-banner">LIVE PLATFORM &bull; AI POWERED &bull; ATTACKLAB v1</div>
          <div className="cinematic-ui">
            <motion.div className="cinematic-kicker" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <i /> CYBER TITAN
            </motion.div>
            <div className="cinematic-rail">
              <span className="active"><i /> 01</span><span>02</span><span>03</span><b>EXPLORE</b>
            </div>
            <div className="cinematic-hero-content">
              <motion.h1
                className="cinematic-title"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              >
                <strong className="cyber-word">CYBER</strong> <strong className="titan-word">TITAN</strong>
              </motion.h1>
              <motion.p
                className="cinematic-description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Master ethical hacking, penetration testing, and bug bounty hunting<br />
                through immersive labs, real-world attack simulations,<br />
                and responsible vulnerability research.
              </motion.p>
              <motion.div
                className="cinematic-action-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Link className="cinematic-action" href="/contact">ENTER ATTACKLAB &rarr;</Link>
              </motion.div>
            </div>
            <FloatingScene />
            <div className="cinematic-status"><i /> ATTACKLAB CORE // AI-01</div>
          </div>
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> SECURITY INTELLIGENCE PLATFORM</div>
            <h1>Master the art of<br /><em>ethical offense.</em></h1>
            <p>One beautifully focused platform to learn, practice, report, and grow your security career.</p>
            <div className="hero-actions">
              <Link className="button" href="/contact" data-cyber="hero-cta">Enter the platform <span>↗</span></Link>
              <Link className="text-link" href="/learn" data-cyber="hero-learn">Explore learning paths <span>→</span></Link>
            </div>
            <div className="trust">
              <div className="avatars"><i>J</i><i>M</i><i>R</i><i>S</i></div>
              <span>Trusted by <b>40,000+</b> security researchers</span>
            </div>
          </div>
          <div className="hero-console">
            <div className="console-top">
              <span className="dots">● ● ●</span><span>ATTACKLAB / LIVE INTELLIGENCE</span>
              <span className="live"><i /> LIVE</span>
            </div>
            <div className="console-content">
              <div className="terminal-line"><span>›</span> initializing secure workspace...</div>
              <div className="shield"><div className="shield-inner">✦</div></div>
              <div className="signal"><span>THREAT SURFACE</span><b>PROTECTED</b><div className="bars">▁▂▃▅▆▅▇▆</div></div>
              <div className="console-stats">
                <div><small>SECURITY SCORE</small><strong>98<span>.4</span></strong></div>
                <div><small>ACTIVE RESEARCHERS</small><strong>12,842</strong></div>
              </div>
            </div>
          </div>
        </section>

        <FadeUp><section className="logo-strip">
          <span>Built for the next generation of security teams</span>
          <b>arc</b><b>vercel</b><b>LINEAR</b><b>RAYCAST</b><b>sonos</b>
        </section></FadeUp>

        <FadeUp delay={0.1}><section className="feature-intro">
          <div className="section-label">01 / THE PLATFORM</div>
          <h2>Everything you need to<br />become <em>dangerously good.</em></h2>
          <p>We brought world-class learning, practice environments, and real-world opportunity into one quietly powerful workspace.</p>
        </section></FadeUp>

        <section className="bento">
          <FadeUp delay={0.1}>
            <motion.article
              className="bento-main"
              data-cyber="bento-main"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <span className="icon">⌘</span>
              <small>LEARN WITH INTENT</small>
              <h3>From curious to<br /><em>formidable.</em></h3>
              <p>Expert-crafted paths that turn theory into instinct.</p>
              <div className="course-list">
                {paths.slice(0, 3).map((p, i) => <div key={p}><span>0{i + 1}</span>{p}<b>→</b></div>)}
              </div>
            </motion.article>
          </FadeUp>
          <FadeUp delay={0.2}>
            <motion.article
              className="bento-practice"
              data-cyber="bento-practice"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="icon">◈</span>
              <small>PRACTICE WITHOUT LIMITS</small>
              <h3>Your private<br />attack surface.</h3>
              <p>Spin up hands-on labs that feel like the real thing.</p>
              <div className="lab-window">
                <span>root@attack:~$</span><b> nmap -sV target.lab</b>
                <i>22/tcp open ssh</i><i>80/tcp open http</i><i className="cursor">_</i>
              </div>
            </motion.article>
          </FadeUp>
          <FadeUp delay={0.3}>
            <motion.article
              className="bento-bounty"
              data-cyber="bento-bounty"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="icon">✦</span>
              <small>TURN SKILL INTO IMPACT</small>
              <h3>Find what<br />others miss.</h3>
              <p>High-signal programs. Clear scopes. Fair rewards.</p>
              <div className="reward"><span>REWARD UNLOCKED</span><b>+$8,500</b><i>Critical severity &middot; CVSS 9.1</i></div>
            </motion.article>
          </FadeUp>
        </section>

        <FadeUp delay={0.1}><section className="metrics">
          <div><strong>40K<span>+</span></strong><p>Security researchers</p></div>
          <div><strong>2.4M</strong><p>Labs completed</p></div>
          <div><strong>$18M<span>+</span></strong><p>Researcher rewards</p></div>
          <div><strong>97<span>%</span></strong><p>Would recommend us</p></div>
        </section></FadeUp>

        <FadeUp delay={0.1}><section className="program-preview">
          <div>
            <div className="section-label">02 / OPPORTUNITY</div>
            <h2>Signal over noise.<br /><em>Always.</em></h2>
            <p>Meet programs that respect your time&mdash;and your craft.</p>
            <Link className="text-link" href="/programs" data-cyber="programs-link">View all programs <span>→</span></Link>
          </div>
          <div className="program-stack">
            {programs.map(([company, reward, response], i) => (
              <motion.article
                key={company}
                className={`program-card p${i}`}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="company-icon">{company.slice(0, 1)}</div>
                <div><b>{company}</b><small>Public program &middot; Web & API</small></div>
                <div><small>MAX REWARD</small><strong>{reward}</strong></div>
                <div className="response"><i /> {response}</div>
                <span>→</span>
              </motion.article>
            ))}
          </div>
        </section></FadeUp>

        <FadeUp delay={0.2}><section className="cta">
          <div className="orb three" />
          <div className="section-label">YOUR NEXT MOVE</div>
          <h2>The work that<br /><em>changes everything.</em></h2>
          <p>Start for free. Stay because you&rsquo;re becoming someone new.</p>
          <Link className="button" href="/contact" data-cyber="cta-final">Get in touch <span>↗</span></Link>
        </section></FadeUp>
      </main>
      <Footer />
    </>
  );
}

const routeData: Record<string, { eyebrow: string; title: string; copy: string; kind: string }> = {
  "learn": { eyebrow: "LEARNING PATHS", title: "Build an instinct for the unknown.", copy: "Structured, hands-on journeys created by practitioners who have been there.", kind: "learn" },
  "features": { eyebrow: "THE ATTACKLAB PLATFORM", title: "A quieter way to get formidable.", copy: "Learning, labs, research workflows, and community\u2014designed as one deliberate system.", kind: "learn" },
  "labs": { eyebrow: "HANDS-ON LABS", title: "Train where the stakes feel real.", copy: "Isolated environments for testing, breaking, and understanding systems safely.", kind: "labs" },
  "challenges": { eyebrow: "CHALLENGES", title: "The next flag is waiting.", copy: "Sharpen your craft with scenario-driven challenges across the modern attack surface.", kind: "challenges" },
  "programs": { eyebrow: "BUG BOUNTY DIRECTORY", title: "Work that gets noticed.", copy: "A high-signal directory of programs built for thoughtful security research.", kind: "programs" },
  "reports": { eyebrow: "VULNERABILITY REPORTS", title: "Write reports that move teams.", copy: "Capture impact, evidence, and remediation with calm, structured clarity.", kind: "programs" },
  "certifications": { eyebrow: "CERTIFICATIONS", title: "Proof of the work.", copy: "Practical credentials that reflect what you can actually do.", kind: "learn" },
  "leaderboard": { eyebrow: "RESEARCHER RANKINGS", title: "Earn your place.", copy: "The practitioners pushing the frontier forward this month.", kind: "leaderboard" },
  "pricing": { eyebrow: "SIMPLE PRICING", title: "Invest in your edge.", copy: "Start free. Upgrade when the work asks for more.", kind: "pricing" },
  "faq": { eyebrow: "COMMON QUESTIONS", title: "Everything, made clear.", copy: "Helpful answers for every stage of your security journey.", kind: "docs" },
  "blog": { eyebrow: "FIELD NOTES", title: "Think like an attacker.", copy: "Ideas, research, and hard-won lessons from the ATTACKLAB network.", kind: "blog" },
  "docs": { eyebrow: "DOCUMENTATION", title: "Make every move count.", copy: "Everything you need to get the most from ATTACKLAB.", kind: "docs" },
  "community": { eyebrow: "THE COLLECTIVE", title: "You don\u2019t get good alone.", copy: "Join a global network of curious, generous security minds.", kind: "community" },
  "careers": { eyebrow: "CAREERS AT ATTACKLAB", title: "Come build the calm.", copy: "We are making the internet a little more resilient, one researcher at a time.", kind: "careers" },
  "about": { eyebrow: "OUR MISSION", title: "A safer internet starts with curiosity.", copy: "ATTACKLAB gives talented people the room, tools, and opportunity to protect what matters.", kind: "about" },
  "contact": { eyebrow: "GET IN TOUCH", title: "Let\u2019s talk security.", copy: "Have a question, partnership idea, or just want to say hello?", kind: "contact" },
};

function Cards({ kind }: { kind: string }) {
  const items = kind === "programs"
    ? ["Vercel \u00b7 Public program", "Arc \u00b7 Web applications", "Wander \u00b7 API & mobile"]
    : kind === "blog"
      ? ["How we found IDOR at scale", "A practical guide to blind SSRF", "The anatomy of a great report"]
      : kind === "leaderboard"
        ? ["01 \u00b7 Cipher_0x", "02 \u00b7 nightshift", "03 \u00b7 RookSec"]
        : kind === "pricing"
          ? ["Explorer \u00b7 $0/mo", "Practitioner \u00b7 $24/mo", "Collective \u00b7 Let\u2019s talk"]
          : kind === "docs"
            ? ["Getting started", "Learning paths", "Submitting reports"]
            : ["Web Exploitation", "API Security", "Active Directory"];
  const symbols = ["\u25c7", "\u25c8", "\u2726"];
  return (
    <div className="route-cards">
      {items.map((x, i) => (
        <motion.article
          key={x}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.12 }}
          whileHover={{ y: -8, scale: 1.02 }}
        >
          <div className="card-symbol">{symbols[i]}</div>
          <small>{kind === "programs" ? "ACTIVE PROGRAM" : kind === "pricing" ? "MEMBERSHIP" : "ATTACKLAB / 0" + (i + 1)}</small>
          <h3>{x}</h3>
          <p>{kind === "programs" ? "Clear scope, thoughtful team, meaningful impact." : "Built for focused practice and measurable progress."}</p>
          <button>Explore <span>→</span></button>
        </motion.article>
      ))}
    </div>
  );
}

export function RoutePage({ route }: { route: string }) {
  const page = routeData[route] || { eyebrow: "ATTACKLAB", title: "The work is the reward.", copy: "A focused space for the next generation of ethical security researchers.", kind: "learn" };
  return (
    <>
      <Header />
      <main className="route">
        <section className="route-hero">
          <div className="orb one" />
          {page.kind === "contact" ? (
            <Contact />
          ) : (
            <>
              <div className="section-label">{page.eyebrow}</div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {page.title.split(".")[0]}.<em>{page.title.includes(".") ? page.title.split(".").slice(1).join(".") : ""}</em>
              </motion.h1>
              <p>{page.copy}</p>
              <Cards kind={page.kind} />
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Contact() {
  const socials = [
    { name: "X", icon: <FaXTwitter size={32} />, href: "https://x.com/mrspecific22", color: "#fff" },
    { name: "GITHUB", icon: <FaGithub size={32} />, href: "https://github.com/specific112", color: "#fff" },
    { name: "INSTAGRAM", icon: <FaInstagram size={32} />, href: "https://www.instagram.com/abdulafeezabdulsamad22", color: "#E4405F" },
    { name: "TIKTOK", icon: <FaTiktok size={32} />, href: "https://www.tiktok.com/@hacker_specific", color: "#fff" },
    { name: "YOUTUBE", icon: <FaYoutube size={32} />, href: "https://www.youtube.com/@Hacker_specific", color: "#FF0000" },
    { name: "TELEGRAM", icon: <FaTelegram size={32} />, href: "https://t.me/abdulsamad728828277", color: "#0088CC" },
  ];

  return (
    <section className="contact-section">
      <div className="contact-orb" />
      <div className="contact-label">— GET IN TOUCH —</div>
      <h2 className="contact-heading">Contact <span>Us</span></h2>
      <p className="contact-subtitle">
        FOLLOW ATTACKLAB ACROSS ALL OFFICIAL CHANNELS OR REACH OUT DIRECTLY
      </p>
      <div className="social-cards">
        {socials.map((s) => (
          <motion.a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.03 }}
          >
            <span className="social-icon" style={{ color: s.color }}>
              {s.icon}
            </span>
            <span className="social-name">{s.name}</span>
          </motion.a>
        ))}
      </div>
      <motion.a
        href="mailto:samadspecific112@gmail.com"
        className="email-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        whileHover={{ y: -4 }}
      >
        <SiGmail size={28} />
        <span>SAMADSPECIFIC112@GMAIL.COM</span>
      </motion.a>
    </section>
  );
}


