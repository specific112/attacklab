"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  id: string; title: string; slug: string; difficulty: string;
  isPublished: boolean; isPremium: boolean;
  _count: { modules: number; enrollments: number; assessments: number; labs: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/courses").then(r => r.json()).then(d => {
      if (d.success) setCourses(d.data);
    }).finally(() => setLoading(false));
  }, []);

  const togglePublish = async (courseId: string, isPublished: boolean) => {
    await fetch("/api/admin/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, isPublished: !isPublished }),
    });
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isPublished: !c.isPublished } : c));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}><img src="/favicon.svg" alt="" style={{ width: 24, height: 24 }} /> ATTACKLAB</Link>
          <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase" }}>Course Management</span>
        </div>
        <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Courses</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{courses.length} courses</p>
        </div>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {courses.map(course => (
              <div key={course.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px 80px 120px", alignItems: "center", gap: 16, padding: "14px 20px", background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--white)" }}>{course.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{course._count.modules} modules · {course._count.enrollments} enrolled</div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>{course.difficulty}</div>
                <div>
                  <span style={{ color: course.isPublished ? "var(--neon-green)" : "var(--muted)", fontSize: 11 }}>
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div>
                  {course.isPremium && <span style={{ background: "rgba(180,78,255,.15)", color: "var(--neon-purple)", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>PRO</span>}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>{course._count.assessments} quizzes</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => togglePublish(course.id, course.isPublished)} style={{
                    background: course.isPublished ? "rgba(255,77,77,.1)" : "rgba(106,255,240,.1)",
                    color: course.isPublished ? "#ff4d4d" : "var(--neon-cyan)",
                    border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                  }}>
                    {course.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <Link href={`/courses/${course.slug}`} style={{ background: "rgba(255,255,255,.06)", color: "var(--muted)", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, textDecoration: "none" }}>View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
