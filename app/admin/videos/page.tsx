"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../../components/auth-provider";

interface Video {
  id: string;
  lessonId: string;
  title: string;
  url?: string;
  thumbnailUrl?: string;
  duration: number;
  status: string;
  createdAt: string;
  lesson?: { title: string; module?: { title: string; course?: { title: string } } };
  chapters: { id: string; title: string; startTime: number; endTime: number }[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; video?: { id: string } }[];
  }[];
}

export default function AdminVideosPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterStart, setChapterStart] = useState(0);
  const [chapterEnd, setChapterEnd] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { router.push("/login?redirect=/admin/videos"); return; }
    fetchData();
  }, [currentUser, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videosRes, coursesRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/courses"),
      ]);
      const videosData = await videosRes.json();
      const coursesData = await coursesRes.json();
      if (videosData.success) setVideos(videosData.data || []);
      if (coursesData.success) setCourses(coursesData.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedLesson) {
      setError("Please select a course and lesson first");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lessonId", selectedLesson);
    formData.append("title", videoTitle || file.name);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const result = await new Promise<{ success: boolean; error?: string; data?: Video }>((resolve, reject) => {
        xhr.onload = () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", "/api/admin/videos/upload");
        xhr.send(formData);
      });

      if (result.success) {
        setSuccess("Video uploaded successfully!");
        setShowUploadModal(false);
        setVideoTitle("");
        setVideoUrl("");
        setVideoDuration(0);
        setSelectedCourse("");
        setSelectedLesson("");
        fetchData();
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlUpload = async () => {
    if (!selectedLesson || !videoUrl) {
      setError("Please fill in all fields");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: selectedLesson,
          title: videoTitle || "Untitled Video",
          url: videoUrl,
          duration: videoDuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Video added successfully!");
        setShowUploadModal(false);
        setVideoTitle("");
        setVideoUrl("");
        setVideoDuration(0);
        setSelectedCourse("");
        setSelectedLesson("");
        fetchData();
      } else {
        setError(data.error || "Failed to add video");
      }
    } catch {
      setError("Failed to add video");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    const res = await fetch("/api/admin/videos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchData();
  };

  const handleAddChapter = async () => {
    if (!showChapterModal || !chapterTitle) return;
    const res = await fetch("/api/admin/videos/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: showChapterModal,
        title: chapterTitle,
        startTime: chapterStart,
        endTime: chapterEnd,
      }),
    });
    if (res.ok) {
      setShowChapterModal(null);
      setChapterTitle("");
      setChapterStart(0);
      setChapterEnd(0);
      fetchData();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const res = await fetch("/api/admin/videos/chapters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: chapterId }),
    });
    if (res.ok) fetchData();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const availableLessons = selectedCourseData?.modules.flatMap(m => m.lessons.filter(l => !l.video)) || [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}><img src="/favicon.svg" alt="" style={{ width: 24, height: 24 }} /> ATTACKLAB</Link>
          <span style={{ color: "var(--neon-purple)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Admin / Videos</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>← Dashboard</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Video Management</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500, marginTop: 4 }}>{videos.length} videos uploaded</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{ background: "var(--neon-cyan)", color: "var(--bg)", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            + Upload Video
          </button>
        </div>

        {error && <div style={{ background: "rgba(255,77,77,.1)", border: "1px solid rgba(255,77,77,.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#ff4d4d", fontSize: 13 }}>{error}</div>}
        {success && <div style={{ background: "rgba(106,255,240,.1)", border: "1px solid rgba(106,255,240,.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "var(--neon-cyan)", fontSize: 13 }}>{success}</div>}

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading videos...</p>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>No videos uploaded yet</p>
            <button onClick={() => setShowUploadModal(true)} style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "1px solid rgba(106,255,240,.3)", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Upload your first video</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {videos.map(video => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 120px 80px 120px", alignItems: "center", gap: 12, padding: "14px 20px", background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--white)" }}>{video.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>{video.lesson?.title || "Unassigned"}</div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>
                  {video.lesson?.module?.course?.title || "—"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{formatDuration(video.duration)}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: video.status === "READY" ? "rgba(106,255,240,.1)" : video.status === "PROCESSING" ? "rgba(255,200,0,.1)" : "rgba(255,77,77,.1)", color: video.status === "READY" ? "var(--neon-cyan)" : video.status === "PROCESSING" ? "#ffc800" : "#ff4d4d" }}>
                    {video.status}
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>{video.chapters.length} chapters</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setShowChapterModal(video.id)} style={{ background: "rgba(180,78,255,.1)", color: "var(--neon-purple)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Chapter</button>
                  <button onClick={() => handleDelete(video.id)} style={{ background: "rgba(255,77,77,.1)", color: "#ff4d4d", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowUploadModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, maxWidth: 500, width: "100%" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Upload Video</h2>

            {/* Course Selection */}
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Course</label>
            <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedLesson(""); }}
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 16 }}>
              <option value="">Select a course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            {/* Lesson Selection */}
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Lesson (without video)</label>
            <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 16 }}>
              <option value="">Select a lesson</option>
              {availableLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>

            {/* Video Title */}
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Video Title</label>
            <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Enter video title"
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 16 }} />

            {/* Upload Options */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "1px solid rgba(106,255,240,.3)", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📁 Upload from Computer
              </button>
            </div>

            {/* Or URL Input */}
            <div style={{ position: "relative", textAlign: "center", margin: "12px 0" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,.08)" }} />
              <span style={{ position: "relative", background: "var(--panel)", padding: "0 12px", fontSize: 12, color: "var(--muted)" }}>OR paste video URL</span>
            </div>

            <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://example.com/video.mp4"
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 12 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Duration (seconds)</label>
            <input type="number" value={videoDuration} onChange={e => setVideoDuration(parseInt(e.target.value) || 0)} placeholder="7200"
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 16 }} />

            {/* Upload Progress */}
            {uploading && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--muted)" }}>Uploading...</span>
                  <span style={{ color: "var(--neon-cyan)" }}>{uploadProgress}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--neon-cyan)", borderRadius: 2, transition: ".3s" }} />
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} style={{ display: "none" }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              {videoUrl && (
                <button onClick={handleUrlUpload} disabled={uploading}
                  style={{ flex: 1, background: "var(--neon-cyan)", color: "var(--bg)", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? "Adding..." : "Add URL Video"}
                </button>
              )}
              <button onClick={() => setShowUploadModal(false)} style={{ flex: 1, background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowChapterModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Add Chapter</h2>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Chapter Title</label>
            <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="e.g., Introduction"
              style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13, marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Start (seconds)</label>
                <input type="number" value={chapterStart} onChange={e => setChapterStart(parseInt(e.target.value) || 0)}
                  style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>End (seconds)</label>
                <input type="number" value={chapterEnd} onChange={e => setChapterEnd(parseInt(e.target.value) || 0)}
                  style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", color: "var(--white)", fontSize: 13 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleAddChapter} style={{ flex: 1, background: "var(--neon-cyan)", color: "var(--bg)", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Chapter</button>
              <button onClick={() => setShowChapterModal(null)} style={{ flex: 1, background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
