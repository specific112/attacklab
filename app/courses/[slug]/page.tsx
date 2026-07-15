"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

interface Lesson { id: string; title: string; contentType: string; duration?: number; }
interface Module { id: string; title: string; lessons: Lesson[]; }
interface Course {
  id: string; title: string; slug: string; description: string;
  difficulty: string; category: string; isPremium: boolean;
  objectives: string[]; prerequisites: string[];
  estimatedHours?: number;
  modules: Module[];
  _count: { enrollments: number };
}

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`).then(r => r.json()).then(d => {
      if (d.success) setCourse(d.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!course) return;
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.success) return;
      fetch(`/api/courses/${course.id}/progress`).then(r => r.json()).then(d => {
        if (d.success) setEnrolled(true);
      }).catch(() => {});
    }).catch(() => {});
  }, [course]);

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, { method: "POST" });
      const data = await res.json();
      if (data.success) setEnrolled(true);
      else alert(data.error || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading...</div>;
  if (!course) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Course not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.76)", backdropFilter: "blur(18px)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--neon-cyan)", textDecoration: "none" }}><span style={{ marginRight: 5 }}>◇</span> ATTACKLAB</Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/courses" style={{ color: "var(--muted)", fontSize: 13 }}>← All Courses</Link>
          {enrolled && <Link href={`/courses/${slug}/learn`} style={{ background: "var(--neon-cyan)", color: "var(--bg)", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Continue Learning →</Link>}
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "60px 5.5vw 120px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, textTransform: "uppercase" }}>{course.difficulty}</span>
            <span style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", fontSize: 11, padding: "4px 10px", borderRadius: 4, textTransform: "uppercase" }}>{course.category}</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, marginBottom: 16 }}>{course.title}</h1>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 700 }}>{course.description}</p>
          <div style={{ display: "flex", gap: 24, marginBottom: 40, fontSize: 13, color: "var(--muted)" }}>
            <span>{course.modules.length} modules</span>
            <span>{course._count.enrollments} enrolled</span>
            {course.estimatedHours && <span>{course.estimatedHours} hours</span>}
          </div>
        </motion.div>

        {!enrolled ? (
          <motion.button onClick={handleEnroll} disabled={enrolling} style={{ background: "var(--neon-cyan)", color: "var(--bg)", padding: "14px 32px", borderRadius: 8, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 48 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {enrolling ? "Enrolling..." : "Enroll in this Course"} →
          </motion.button>
        ) : (
          <Link href={`/courses/${slug}/learn`} style={{ display: "inline-block", background: "var(--neon-cyan)", color: "var(--bg)", padding: "14px 32px", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 48 }}>
            Continue Learning →
          </Link>
        )}

        {course.objectives.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What you'll learn</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {course.objectives.map((obj, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "var(--muted)" }}>
                  <span style={{ color: "var(--neon-cyan)" }}>◇</span> {obj}
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Course Modules</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {course.modules.map((mod, i) => (
            <motion.div key={mod.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ color: "var(--neon-cyan)", fontWeight: 700, fontSize: 13, minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                <h4 style={{ fontSize: 15, fontWeight: 600 }}>{mod.title}</h4>
              </div>
              <div style={{ paddingLeft: 36, display: "flex", flexDirection: "column", gap: 6 }}>
                {mod.lessons.map(lesson => (
                  <div key={lesson.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", padding: "4px 0" }}>
                    <span>{lesson.contentType === "VIDEO" ? "▶" : "◇"}</span>
                    <span>{lesson.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
