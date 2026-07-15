"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth-provider";

interface Stats {
  users: { total: number; verified: number; unverified: number; active: number; suspended: number; recent: { id: string; email: string; displayName: string; createdAt: string; lastLoginAt: string | null; emailVerified: string | null; isSuspended: boolean }[] };
  platform: { courses: number; enrollments: number; labs: number; assessments: number };
  auth: { recentLogins: number; failedLogins: number };
  payments: { total: number; revenue: number };
  guests: { totalVisits: number; uniqueVisitors: number; todayVisits: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?redirect=/admin"); return; }

    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
      else { setError(d.error || "Access denied"); }
    }).catch(() => setError("Failed to load stats")).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading admin dashboard...</div>;
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48, color: "#ff4d4d" }}>⛔</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#ff4d4d" }}>Access Denied</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{error}</p>
        <Link href="/" style={{ color: "var(--neon-cyan)", fontSize: 13, marginTop: 8 }}>← Go to homepage</Link>
      </div>
    );
  }
  if (!stats) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}>◇ ATTACKLAB</Link>
          <span style={{ color: "var(--neon-purple)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Admin Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/admin/users" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Users</Link>
          <Link href="/admin/courses" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Courses</Link>
          <Link href="/dashboard" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>My Dashboard</Link>
          <Link href="/" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Home</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Platform Overview</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Welcome back, Admin. Here&apos;s your platform at a glance.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Total Users", value: stats.users.total, color: "var(--neon-cyan)" },
            { label: "Verified Users", value: stats.users.verified, color: "var(--neon-green)" },
            { label: "Unverified Users", value: stats.users.unverified, color: "#ff6b9d" },
            { label: "Active Users", value: stats.users.active, color: "var(--neon-cyan)" },
            { label: "Suspended Users", value: stats.users.suspended, color: "#ff4d4d" },
            { label: "Courses", value: stats.platform.courses, color: "var(--neon-blue)" },
            { label: "Enrollments", value: stats.platform.enrollments, color: "var(--neon-purple)" },
            { label: "Labs", value: stats.platform.labs, color: "var(--neon-green)" },
            { label: "Assessments", value: stats.platform.assessments, color: "var(--neon-orange)" },
            { label: "Logins (30d)", value: stats.auth.recentLogins, color: "var(--neon-cyan)" },
            { label: "Failed Logins (30d)", value: stats.auth.failedLogins, color: "#ff4d4d" },
            { label: "Page Visits", value: stats.guests?.totalVisits || 0, color: "var(--neon-magenta)" },
          ].map((stat, i) => (
            <motion.div key={stat.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Users */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Users</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.users.recent?.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 120px", alignItems: "center", gap: 16, padding: "14px 20px", background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--white)" }}>{u.displayName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{u.email}</div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </div>
                <div style={{ color: u.emailVerified ? "var(--neon-green)" : "#ff6b9d", fontSize: 11 }}>
                  {u.emailVerified ? "Verified" : "Unverified"}
                </div>
                <div style={{ color: u.isSuspended ? "#ff4d4d" : "var(--neon-green)", fontSize: 11 }}>
                  {u.isSuspended ? "Suspended" : "Active"}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>
                  Last login: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </div>
              </div>
            ))}
            {(!stats.users.recent || stats.users.recent.length === 0) && (
              <p style={{ color: "var(--muted)", fontSize: 13, padding: 20 }}>No users yet.</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          <Link href="/admin/users" style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, textDecoration: "none", transition: ".2s" }}>
            <h3 style={{ color: "var(--white)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>User Management</h3>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Search, view, suspend, and manage all user accounts</p>
          </Link>
          <Link href="/admin/courses" style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, textDecoration: "none", transition: ".2s" }}>
            <h3 style={{ color: "var(--white)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Course Management</h3>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Manage courses, modules, and published content</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
