"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Lesson { id: string; title: string; content: string; contentType: string; completed: boolean; }
interface Module { id: string; title: string; lessons: Lesson[]; }
interface Course { id: string; title: string; slug: string; modules: Module[]; }
interface Progress { completedLessons: number; totalLessons: number; completionPercentage: number; }

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${slug}`).then(r => r.json()),
      fetch(`/api/courses/${slug}/progress`).then(r => r.json()),
    ]).then(([courseData, progressData]) => {
      if (courseData.success) {
        setCourse(courseData.data);
        const firstIncomplete = courseData.data.modules
          ?.flatMap((m: Module) => m.lessons)
          ?.find((l: Lesson) => !l.completed);
        if (firstIncomplete) setActiveLesson(firstIncomplete);
        else if (courseData.data.modules?.[0]?.lessons?.[0]) setActiveLesson(courseData.data.modules[0].lessons[0]);
      }
      if (progressData.success) setProgress(progressData.data.progress);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleComplete = async () => {
    if (!activeLesson || completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/complete`, { method: "POST" });
      if (res.ok) {
        setActiveLesson(prev => prev ? { ...prev, completed: true } : prev);
        // Refresh progress
        fetch(`/api/courses/${slug}/progress`).then(r => r.json()).then(d => {
          if (d.success) setProgress(d.data.progress);
        });
      }
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading...</div>;
  if (!course) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Course not found</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ width: 320, borderRight: "1px solid var(--line)", background: "rgba(9,10,13,.9)", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
          <Link href={`/courses/${slug}`} style={{ color: "var(--neon-cyan)", fontSize: 12, textDecoration: "none" }}>← {course.title}</Link>
          {progress && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                <span>Progress</span>
                <span>{progress.completionPercentage}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${progress.completionPercentage}%`, background: "var(--neon-cyan)", borderRadius: 2, transition: ".3s" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{progress.completedLessons}/{progress.totalLessons} lessons</div>
            </div>
          )}
        </div>
        <nav style={{ padding: "12px 0" }}>
          {course.modules.map((mod, i) => (
            <div key={mod.id}>
              <div style={{ padding: "8px 20px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>
                {String(i + 1).padStart(2, "0")} · {mod.title}
              </div>
              {mod.lessons.map(lesson => (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson)} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 20px 10px 36px",
                  background: activeLesson?.id === lesson.id ? "rgba(106,255,240,.08)" : "transparent",
                  border: "none", borderLeft: activeLesson?.id === lesson.id ? "2px solid var(--neon-cyan)" : "2px solid transparent",
                  color: activeLesson?.id === lesson.id ? "var(--neon-cyan)" : lesson.completed ? "var(--neon-green)" : "var(--muted)",
                  fontSize: 13, cursor: "pointer", textAlign: "left", transition: ".15s",
                }}>
                  <span style={{ fontSize: 10 }}>{lesson.completed ? "✓" : lesson.contentType === "VIDEO" ? "▶" : "◇"}</span>
                  {lesson.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 5.5vw", maxWidth: 800 }}>
        {activeLesson ? (
          <motion.div key={activeLesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>{activeLesson.contentType}</span>
              {activeLesson.completed && <span style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-green)", fontSize: 10, padding: "2px 8px", borderRadius: 4 }}>COMPLETED</span>}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{activeLesson.title}</h2>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--muted)" }}>
              {activeLesson.content || "This lesson content is being prepared. Check back soon for the full material."}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              {!activeLesson.completed && (
                <button onClick={handleComplete} disabled={completing} style={{
                  background: "var(--neon-cyan)", color: "var(--bg)", padding: "12px 24px",
                  borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                }}>
                  {completing ? "Saving..." : "Mark as Complete ✓"}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>Select a lesson from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
}
