"use client";

import { useState } from "react";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  sortOrder?: number;
  description?: string;
}

interface Note {
  id: string;
  timestamp?: number;
  title?: string;
  content: string;
  isPinned: boolean;
}

interface Bookmark {
  id: string;
  timestamp: number;
  label?: string;
}

interface ContentPanelProps {
  lessonTitle: string;
  content: string;
  objectives: string[];
  chapters: Chapter[];
  notes: Note[];
  bookmarks: Bookmark[];
  currentChapterId?: string;
  onJumpToTime: (time: number) => void;
  onSaveNote: (note: { title: string; content: string; timestamp?: number }) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
}

export default function ContentPanel({
  lessonTitle,
  content,
  objectives,
  chapters,
  notes,
  bookmarks,
  currentChapterId,
  onJumpToTime,
  onSaveNote,
  onDeleteNote,
  onTogglePin,
  onDeleteBookmark,
}: ContentPanelProps) {
  const [activeTab, setActiveTab] = useState<"lesson" | "notes" | "bookmarks">("lesson");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    onSaveNote({ title: noteTitle || "Untitled Note", content: noteContent });
    setNoteTitle("");
    setNoteContent("");
    setShowNoteForm(false);
  };

  const filteredContent = searchQuery
    ? content.split("\n").filter((line) =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      ).join("\n")
    : content;

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.id).getTime() - new Date(a.id).getTime();
  });

  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12,
      height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)" }}>
        {(["lesson", "notes", "bookmarks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "12px 8px", background: "none", border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--neon-cyan)" : "2px solid transparent",
              color: activeTab === tab ? "var(--neon-cyan)" : "var(--muted)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {tab === "lesson" ? "Lesson" : tab === "notes" ? `Notes (${notes.length})` : `Bookmarks (${bookmarks.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Lesson Tab */}
        {activeTab === "lesson" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--white)", marginBottom: 16 }}>
              {lessonTitle}
            </h2>

            {/* Learning Objectives */}
            {objectives.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--neon-purple)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                  Learning Objectives
                </h3>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {objectives.map((obj, i) => (
                    <li key={i} style={{ fontSize: 13, color: "var(--white)", marginBottom: 4, fontWeight: 500 }}>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chapters Navigation */}
            {chapters.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--neon-cyan)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                  Chapters
                </h3>
                {chapters.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => onJumpToTime(ch.startTime)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "8px 10px", background: currentChapterId === ch.id ? "rgba(106,255,240,.08)" : "none",
                      border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", marginBottom: 2,
                    }}
                  >
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                      background: currentChapterId === ch.id ? "rgba(106,255,240,.2)" : "rgba(255,255,255,.05)",
                      color: currentChapterId === ch.id ? "var(--neon-cyan)" : "var(--muted)",
                    }}>
                      {formatTime(ch.startTime)}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: currentChapterId === ch.id ? 700 : 500,
                      color: currentChapterId === ch.id ? "var(--neon-cyan)" : "var(--white)",
                    }}>
                      {ch.title}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Lesson Content */}
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--white)" }}>
              {filteredContent.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 20, fontWeight: 800, margin: "20px 0 10px" }}>{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 8px", color: "var(--neon-cyan)" }}>{line.slice(4)}</h3>;
                if (line.startsWith("- ")) return <li key={i} style={{ marginLeft: 16, marginBottom: 4, fontWeight: 500 }}>{line.slice(2)}</li>;
                if (line.startsWith("```")) return <pre key={i} style={{ background: "rgba(0,0,0,.3)", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto", margin: "8px 0", fontFamily: "monospace", color: "var(--neon-green)" }}><code>{line.slice(3, -3)}</code></pre>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} style={{ margin: "8px 0", fontWeight: 500 }}>{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--white)" }}>My Notes</h3>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                style={{
                  background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "1px solid rgba(106,255,240,.3)",
                  borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                + New Note
              </button>
            </div>

            {/* New Note Form */}
            {showNoteForm && (
              <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <input
                  type="text" placeholder="Note title (optional)"
                  value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)",
                    borderRadius: 6, padding: "8px 12px", color: "var(--white)", fontSize: 13, marginBottom: 8, outline: "none",
                  }}
                />
                <textarea
                  placeholder="Write your note..."
                  value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid var(--line)",
                    borderRadius: 6, padding: "8px 12px", color: "var(--white)", fontSize: 13, resize: "vertical", outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={handleSaveNote} style={{ background: "var(--neon-cyan)", color: "#000", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setShowNoteForm(false)} style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Notes List */}
            {sortedNotes.map((note) => (
              <div key={note.id} style={{
                background: note.isPinned ? "rgba(180,78,255,.05)" : "rgba(255,255,255,.03)",
                border: note.isPinned ? "1px solid rgba(180,78,255,.2)" : "1px solid var(--line)",
                borderRadius: 8, padding: 12, marginBottom: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {note.isPinned && <span style={{ fontSize: 10, color: "var(--neon-purple)" }}>📌</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--white)" }}>{note.title || "Untitled"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {note.timestamp !== undefined && (
                      <button onClick={() => onJumpToTime(note.timestamp!)} style={{ background: "none", border: "none", color: "var(--neon-cyan)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                        {formatTime(note.timestamp)}
                      </button>
                    )}
                    <button onClick={() => onTogglePin(note.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
                      {note.isPinned ? "📌" : "📍"}
                    </button>
                    <button onClick={() => onDeleteNote(note.id)} style={{ background: "none", border: "none", color: "#ff4d4d", fontSize: 12, cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{note.content}</p>
              </div>
            ))}

            {notes.length === 0 && !showNoteForm && (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: 20, fontSize: 13 }}>
                No notes yet. Click "+ New Note" to start taking notes.
              </p>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === "bookmarks" && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 16 }}>Bookmarks</h3>
            {bookmarks.sort((a, b) => a.timestamp - b.timestamp).map((bm) => (
              <div key={bm.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: "rgba(255,255,255,.03)", border: "1px solid var(--line)",
                borderRadius: 8, marginBottom: 6,
              }}>
                <button
                  onClick={() => onJumpToTime(bm.timestamp)}
                  style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", flex: 1 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: "rgba(180,78,255,.15)", color: "var(--neon-purple)",
                    }}>
                      {formatTime(bm.timestamp)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>
                      {bm.label || `Bookmark at ${formatTime(bm.timestamp)}`}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteBookmark(bm.id)}
                  style={{ background: "none", border: "none", color: "#ff4d4d", fontSize: 12, cursor: "pointer", padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>
            ))}
            {bookmarks.length === 0 && (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: 20, fontSize: 13 }}>
                No bookmarks yet. Use the 🔖 button on the video player to add bookmarks.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
