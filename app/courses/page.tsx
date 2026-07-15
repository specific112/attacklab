"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  difficulty: string;
  category: string;
  isPremium: boolean;
  estimatedHours?: number;
  _count: { modules: number; enrollments: number };
}

const diffColors: Record<string, string> = { BEGINNER: "#a1ff8b", INTERMEDIATE: "#6afff0", ADVANCED: "#ff6b9d" };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => {
      if (d.success) setCourses(d.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.76)", backdropFilter: "blur(18px)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 18, color: "var(--neon-cyan)", textDecoration: "none" }}><img src="/favicon.svg" alt="" style={{ width: 26, height: 26 }} /> ATTACKLAB</Link>
        <Link href="/dashboard" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to Dashboard</Link>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 5.5vw" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: "var(--neon-cyan)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>LEARNING PATHS</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, lineHeight: 1.15 }}>All Courses</h1>
          <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 15 }}>Structured, hands-on journeys created by practitioners who have been there.</p>
        </div>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading courses...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <Link href={`/courses/${course.slug}`} style={{ display: "block", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 24, textDecoration: "none", transition: ".2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ background: diffColors[course.difficulty] + "22", color: diffColors[course.difficulty], fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase" }}>{course.difficulty}</span>
                    <span style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>{course.category}</span>
                    {course.isPremium && <span style={{ background: "rgba(180,78,255,.15)", color: "var(--neon-purple)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>PRO</span>}
                  </div>
                  <h3 style={{ color: "var(--white)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{course.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{course.shortDescription || course.category}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                    <span>{course._count.modules} modules</span>
                    <span>{course._count.enrollments} enrolled</span>
                    {course.estimatedHours && <span>{course.estimatedHours}h</span>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
