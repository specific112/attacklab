"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Stats {
  users: { total: number; verified: number; unverified: number; active: number; suspended: number };
  platform: { courses: number; enrollments: number; labs: number; assessments: number };
  auth: { recentLogins: number; failedLogins: number };
  payments: { total: number; revenue: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
      else { setError(d.error || "Access denied"); router.push("/login"); }
    }).catch(() => setError("Failed to load stats")).finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading admin dashboard...</div>;
  if (error) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4d4d" }}>{error}</div>;
  if (!stats) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}>◇ ATTACKLAB</Link>
          <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>Admin Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/admin/users" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Users</Link>
          <Link href="/admin/courses" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Courses</Link>
          <Link href="/" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Home</Link>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Platform Overview</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Total Users", value: stats.users.total, color: "var(--neon-cyan)" },
            { label: "Verified Users", value: stats.users.verified, color: "var(--neon-green)" },
            { label: "Unverified Users", value: stats.users.unverified, color: "#ff6b9d" },
            { label: "Active Users", value: stats.users.active, color: "var(--neon-cyan)" },
            { label: "Courses", value: stats.platform.courses, color: "var(--neon-blue)" },
            { label: "Enrollments", value: stats.platform.enrollments, color: "var(--neon-purple)" },
            { label: "Labs", value: stats.platform.labs, color: "var(--neon-green)" },
            { label: "Assessments", value: stats.platform.assessments, color: "var(--neon-orange)" },
            { label: "Recent Logins (30d)", value: stats.auth.recentLogins, color: "var(--neon-cyan)" },
            { label: "Failed Logins (30d)", value: stats.auth.failedLogins, color: "#ff4d4d" },
            { label: "Payments", value: stats.payments.total, color: "var(--neon-green)" },
            { label: "Revenue", value: `$${(stats.payments.revenue / 100).toFixed(2)}`, color: "var(--neon-green)" },
          ].map((stat, i) => (
            <motion.div key={stat.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Link href="/admin/users" style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, textDecoration: "none" }}>
            <h3 style={{ color: "var(--white)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>User Management</h3>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Search, view, and manage user accounts and roles</p>
          </Link>
          <Link href="/admin/courses" style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, textDecoration: "none" }}>
            <h3 style={{ color: "var(--white)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Course Management</h3>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Manage courses, modules, and published content</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
