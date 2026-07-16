"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import VideoPlayer from "../../../../components/video-player";
import ContentPanel from "../../../../components/content-panel";

interface Chapter { id: string; title: string; startTime: number; endTime: number; sortOrder: number; description?: string; }
interface Video { id: string; url?: string; duration: number; chapters: Chapter[]; }
interface Lesson { id: string; title: string; content: string; contentType: string; completed: boolean; video?: Video; }
interface Module { id: string; title: string; lessons: Lesson[]; }
interface Course { id: string; title: string; slug: string; modules: Module[]; objectives: string[]; }
interface Progress { completedLessons: number; totalLessons: number; completionPercentage: number; }
interface VideoProgress { currentTime: number; watchedPercent: number; isCompleted: boolean; }
interface Note { id: string; timestamp?: number; title?: string; content: string; isPinned: boolean; }
interface Bookmark { id: string; timestamp: number; label?: string; }

export default function LearnPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Fetch course data
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

  // Fetch lesson-specific data when lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    Promise.all([
      fetch(`/api/users/video-progress?lessonId=${activeLesson.id}`).then(r => r.json()),
      fetch(`/api/users/notes?lessonId=${activeLesson.id}`).then(r => r.json()),
      fetch(`/api/users/bookmarks?lessonId=${activeLesson.id}`).then(r => r.json()),
    ]).then(([vpRes, notesRes, bmRes]) => {
      if (vpRes.success) setVideoProgress(vpRes.data);
      if (notesRes.success) setNotes(notesRes.data || []);
      if (bmRes.success) setBookmarks(bmRes.data || []);
    });
  }, [activeLesson]);

  const handleTimeUpdate = useCallback(async (time: number) => {
    if (!activeLesson) return;
    const duration = activeLesson.video?.duration || 0;
    await fetch("/api/users/video-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLesson.id, currentTime: Math.floor(time), duration }),
    });
    setVideoProgress(prev => prev ? { ...prev, currentTime: Math.floor(time) } : null);
  }, [activeLesson]);

  const handleSeek = useCallback((time: number) => {
    handleTimeUpdate(time);
  }, [handleTimeUpdate]);

  const handleVideoComplete = useCallback(async () => {
    if (!activeLesson) return;
    setVideoProgress(prev => prev ? { ...prev, isCompleted: true, watchedPercent: 100 } : null);
    // Auto-complete lesson if not already
    if (!activeLesson.completed) {
      await handleComplete();
    }
  }, [activeLesson]);

  const handleAddBookmark = useCallback(async (time: number) => {
    if (!activeLesson) return;
    const res = await fetch("/api/users/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLesson.id, timestamp: Math.floor(time) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) setBookmarks(prev => [...prev, data.data]);
    }
  }, [activeLesson]);

  const handleDeleteBookmark = useCallback(async (id: string) => {
    await fetch("/api/users/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleAddNote = useCallback(async (time: number) => {
    if (!activeLesson) return;
    const res = await fetch("/api/users/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLesson.id, content: "New note", timestamp: Math.floor(time) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) setNotes(prev => [data.data, ...prev]);
    }
  }, [activeLesson]);

  const handleSaveNote = useCallback(async (note: { title: string; content: string; timestamp?: number }) => {
    if (!activeLesson) return;
    const res = await fetch("/api/users/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLesson.id, ...note }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) setNotes(prev => [data.data, ...prev]);
    }
  }, [activeLesson]);

  const handleDeleteNote = useCallback(async (id: string) => {
    await fetch("/api/users/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleTogglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    await fetch("/api/users/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPinned: !note.isPinned }),
    });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }, [notes]);

  const handleJumpToTime = useCallback((time: number) => {
    const videoEl = document.querySelector("video");
    if (videoEl) {
      videoEl.currentTime = time;
      videoEl.play();
    }
  }, []);

  const handleComplete = async () => {
    if (!activeLesson || completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/complete`, { method: "POST" });
      if (res.ok) {
        setActiveLesson(prev => prev ? { ...prev, completed: true } : prev);
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
      <aside style={{ width: 300, borderRight: "1px solid var(--line)", background: "rgba(9,10,13,.9)", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
          <Link href={`/courses/${slug}`} style={{ color: "var(--neon-cyan)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>← {course.title}</Link>
          {progress && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>
                <span>Progress</span>
                <span>{progress.completionPercentage}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${progress.completionPercentage}%`, background: "var(--neon-cyan)", borderRadius: 2, transition: ".3s" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontWeight: 500 }}>{progress.completedLessons}/{progress.totalLessons} lessons</div>
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
                  fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: ".15s",
                }}>
                  <span style={{ fontSize: 10 }}>{lesson.completed ? "✓" : "▶"}</span>
                  {lesson.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeLesson ? (
          <motion.div key={activeLesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Video Player */}
            <div style={{ padding: "16px 20px 0" }}>
              <VideoPlayer
                videoUrl={activeLesson.video?.url}
                title={activeLesson.title}
                chapters={activeLesson.video?.chapters || []}
                bookmarks={bookmarks}
                notes={notes}
                currentTime={videoProgress?.currentTime || 0}
                onTimeUpdate={handleTimeUpdate}
                onSeek={handleSeek}
                onAddBookmark={handleAddBookmark}
                onAddNote={handleAddNote}
                onComplete={handleVideoComplete}
              />
              {/* Video Progress Bar */}
              {videoProgress && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", fontSize: 12 }}>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.08)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${videoProgress.watchedPercent}%`, background: "var(--neon-cyan)", borderRadius: 2 }} />
                  </div>
                  <span style={{ color: "var(--muted)", fontWeight: 500 }}>{Math.round(videoProgress.watchedPercent)}% watched</span>
                </div>
              )}
            </div>

            {/* Content Panel */}
            <div style={{ flex: 1, padding: "0 20px 16px", overflow: "hidden" }}>
              <ContentPanel
                lessonTitle={activeLesson.title}
                content={activeLesson.content || "This lesson content is being prepared. Check back soon for the full material."}
                objectives={course.objectives?.slice(0, 3) || []}
                chapters={activeLesson.video?.chapters || []}
                notes={notes}
                bookmarks={bookmarks}
                currentChapterId={undefined}
                onJumpToTime={handleJumpToTime}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onDeleteBookmark={handleDeleteBookmark}
              />
            </div>

            {/* Bottom Actions */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {activeLesson.completed && <span style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-green)", fontSize: 11, padding: "4px 10px", borderRadius: 4, fontWeight: 600 }}>COMPLETED</span>}
              </div>
              {!activeLesson.completed && (
                <button onClick={handleComplete} disabled={completing} style={{
                  background: "var(--neon-cyan)", color: "var(--bg)", padding: "10px 20px",
                  borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                }}>
                  {completing ? "Saving..." : "Mark as Complete ✓"}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>Select a lesson from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
}
