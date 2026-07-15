"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth-provider";

interface DashboardData {
  enrollments: { id: string; status: string; enrolledAt: string; completedAt?: string; course: { id: string; title: string; slug: string; category: string; difficulty: string; thumbnailUrl?: string } }[];
  lessonProgress: { id: string; status: string; completedAt?: string; lesson: { id: string; title: string; moduleId: string } }[];
  assessmentAttempts: { id: string; score?: number; status: string; completedAt?: string; assessment: { id: string; title: string; passScore: number } }[];
  labProgress: { id: string; status: string; score?: number; flagsFound: number; lab: { id: string; title: string; category: string } }[];
  streak: { currentStreak: number; longestStreak: number };
  certificates: { id: string; certNumber: string; issuedAt: string; course: { title: string } }[];
  stats: { totalEnrollments: number; completedLessons: number; totalLessons: number; completionRate: number; certificatesEarned: number };
}

interface Notification { id: string; title: string; body?: string; type: string; isRead: boolean; createdAt: string; link?: string }

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "quizzes" | "labs" | "certs">("overview");

  const fetchDashboard = useCallback(async () => {
    try {
      const [progressRes, notifRes] = await Promise.all([
        fetch("/api/users/progress"),
        fetch("/api/users/notifications").then(r => r.json()).catch(() => ({ success: false, data: [] })),
      ]);
      const progressData = await progressRes.json();
      if (progressData.success) setData(progressData.data);
      if (notifRes.success) setNotifications(notifRes.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchDashboard();
  }, [user, authLoading, router, fetchDashboard]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Loading dashboard...
      </div>
    );
  }

  if (!user || !data) return null;

  const firstName = user.displayName?.split(" ")[0] || "Agent";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const xpPoints = (data.stats.completedLessons * 50) + (data.stats.certificatesEarned * 500) + (data.labProgress.length * 100);
  const level = Math.floor(xpPoints / 500) + 1;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}><img src="/favicon.svg" alt="" style={{ width: 24, height: 24 }} /> ATTACKLAB</Link>
          <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/courses" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Courses</Link>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--neon-purple), var(--neon-magenta))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
            {user.displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <button onClick={logout} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>{today}</div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, margin: "0 0 8px" }}>
            Welcome back, <span style={{ color: "var(--neon-cyan)" }}>{firstName}</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {data.stats.totalEnrollments === 0
              ? "Start your ethical hacking journey today."
              : `You've completed ${data.stats.completedLessons} lessons across ${data.stats.totalEnrollments} courses.`}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "XP Points", value: xpPoints.toLocaleString(), color: "var(--neon-cyan)", icon: "✦" },
            { label: "Level", value: level, color: "var(--neon-purple)", icon: "◆" },
            { label: "Daily Streak", value: `${data.streak.currentStreak} days`, color: "var(--neon-orange)", icon: "🔥" },
            { label: "Courses", value: data.stats.totalEnrollments, color: "var(--neon-green)", icon: "◇" },
            { label: "Lessons Done", value: data.stats.completedLessons, color: "var(--neon-blue)", icon: "▸" },
            { label: "Labs Completed", value: data.labProgress.filter(l => l.status === "COMPLETED").length, color: "var(--neon-magenta)", icon: "◈" },
            { label: "Certificates", value: data.stats.certificatesEarned, color: "var(--neon-yellow)", icon: "★" },
            { label: "Quiz Avg", value: data.assessmentAttempts.length > 0 ? `${Math.round(data.assessmentAttempts.reduce((a, b) => a + (b.score || 0), 0) / data.assessmentAttempts.length)}%` : "N/A", color: "var(--neon-cyan)", icon: "%" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{stat.label}</span>
                <span style={{ fontSize: 14, opacity: 0.5 }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
          {(["overview", "courses", "quizzes", "labs", "certs"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid var(--neon-cyan)" : "2px solid transparent",
              padding: "12px 16px", color: activeTab === tab ? "var(--neon-cyan)" : "var(--muted)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: ".2s"
            }}>
              {tab === "certs" ? "Certificates" : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Progress */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Learning Progress</h3>
              {data.enrollments.length > 0 ? data.enrollments.slice(0, 5).map(e => {
                const courseLessons = data.lessonProgress.filter(lp => lp.lesson.moduleId && data.enrollments.some(en => en.course.id === e.course.id));
                const done = courseLessons.filter(lp => lp.status === "COMPLETED").length;
                const total = courseLessons.length || 1;
                return (
                  <Link key={e.id} href={`/courses/${e.course.slug}/learn`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)", textDecoration: "none" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>{e.course.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{done}/{total} lessons</div>
                    </div>
                    <div style={{ width: 60, height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${Math.round((done / total) * 100)}%`, background: "var(--neon-cyan)", borderRadius: 2 }} />
                    </div>
                  </Link>
                );
              }) : (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No courses yet. <Link href="/courses" style={{ color: "var(--neon-cyan)" }}>Browse courses →</Link></p>
              )}
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
              {data.lessonProgress.filter(lp => lp.status === "COMPLETED").slice(-5).reverse().map(lp => (
                <div key={lp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 13, color: "var(--muted)" }}>
                  <span style={{ color: "var(--neon-green)", fontSize: 10 }}>✓</span>
                  <span style={{ flex: 1 }}>Completed: {lp.lesson.title}</span>
                  <span style={{ fontSize: 11, color: "#4a4d5a" }}>{lp.completedAt ? new Date(lp.completedAt).toLocaleDateString() : ""}</span>
                </div>
              ))}
              {data.lessonProgress.filter(lp => lp.status === "COMPLETED").length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No activity yet. Start a course to begin tracking.</p>
              )}
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Notifications</h3>
              {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
                <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: n.isRead ? "var(--muted)" : "var(--neon-cyan)", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>}
                  </div>
                </div>
              )) : (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No notifications.</p>
              )}
            </motion.div>

            {/* Recommended */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recommended Next</h3>
              <Link href="/courses" style={{ display: "block", padding: "16px", background: "rgba(106,255,240,.05)", border: "1px solid rgba(106,255,240,.15)", borderRadius: 10, textDecoration: "none" }}>
                <div style={{ fontSize: 12, color: "var(--neon-cyan)", marginBottom: 6 }}>NEXT STEP</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 4 }}>
                  {data.enrollments.length === 0 ? "Start Your First Course" : "Continue Learning"}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {data.enrollments.length === 0 ? "Browse our ethical hacking courses" : "Pick up where you left off"}
                </div>
              </Link>
            </motion.div>
          </div>
        )}

        {activeTab === "courses" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {data.enrollments.map(e => {
              const courseLps = data.lessonProgress.filter(lp => e.course.id && lp.lesson.moduleId);
              const done = courseLps.filter(lp => lp.status === "COMPLETED").length;
              const total = courseLps.length || 1;
              const pct = Math.round((done / total) * 100);
              return (
                <Link key={e.id} href={`/courses/${e.course.slug}/learn`} style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 20, textDecoration: "none" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", textTransform: "uppercase" }}>{e.course.difficulty}</span>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,.05)", color: "var(--muted)", textTransform: "uppercase" }}>{e.course.category}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--white)", margin: "0 0 12px" }}>{e.course.title}</h3>
                  <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "var(--neon-green)" : "var(--neon-cyan)", borderRadius: 2, transition: ".3s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                    <span>{done}/{total} lessons</span>
                    <span>{pct}%</span>
                  </div>
                </Link>
              );
            })}
            {data.enrollments.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 16, color: "var(--white)", marginBottom: 8 }}>No courses yet</p>
                <Link href="/courses" style={{ color: "var(--neon-cyan)", fontSize: 13 }}>Browse courses →</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div>
            {data.assessmentAttempts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.assessmentAttempts.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: (a.score || 0) >= a.assessment.passScore ? "rgba(106,255,240,.1)" : "rgba(255,77,77,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: (a.score || 0) >= a.assessment.passScore ? "var(--neon-green)" : "#ff4d4d" }}>
                      {a.score || 0}%
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--white)" }}>{a.assessment.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Pass: {a.assessment.passScore}% · {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ""}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4, background: (a.score || 0) >= a.assessment.passScore ? "rgba(106,255,240,.1)" : "rgba(255,77,77,.1)", color: (a.score || 0) >= a.assessment.passScore ? "var(--neon-green)" : "#ff4d4d" }}>
                      {(a.score || 0) >= a.assessment.passScore ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No quizzes taken yet.</p>
            )}
          </div>
        )}

        {activeTab === "labs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {data.labProgress.map(lp => (
              <div key={lp.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{lp.lab.category}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 10 }}>{lp.lab.title}</h3>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                  <span>Flags: {lp.flagsFound}</span>
                  <span style={{ color: lp.status === "COMPLETED" ? "var(--neon-green)" : "var(--neon-orange)" }}>{lp.status}</span>
                </div>
              </div>
            ))}
            {data.labProgress.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 16, color: "var(--white)", marginBottom: 8 }}>No labs completed yet</p>
                <Link href="/courses" style={{ color: "var(--neon-cyan)", fontSize: 13 }}>Start a course with labs →</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "certs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {data.certificates.map(cert => (
              <div key={cert.id} style={{ background: "linear-gradient(135deg, rgba(106,255,240,.05), rgba(180,78,255,.05))", border: "1px solid rgba(106,255,240,.15)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>★</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--white)", marginBottom: 6 }}>{cert.course.title}</h3>
                <p style={{ fontSize: 11, color: "var(--neon-cyan)", marginBottom: 4 }}>CERT #{cert.certNumber}</p>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
              </div>
            ))}
            {data.certificates.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 16, color: "var(--white)", marginBottom: 8 }}>No certificates yet</p>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Complete a course to earn your first certificate.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
