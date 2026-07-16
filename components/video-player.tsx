"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  sortOrder: number;
}

interface Bookmark {
  id: string;
  timestamp: number;
  label?: string;
}

interface Note {
  id: string;
  timestamp?: number;
  title?: string;
  content: string;
  isPinned: boolean;
}

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  chapters: Chapter[];
  bookmarks: Bookmark[];
  notes: Note[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  onAddBookmark: (time: number) => void;
  onAddNote: (time: number) => void;
  onComplete: () => void;
}

export default function VideoPlayer({
  videoUrl,
  title,
  chapters,
  bookmarks,
  notes,
  currentTime: savedTime,
  onTimeUpdate,
  onSeek,
  onAddBookmark,
  onAddNote,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isPiP, setIsPiP] = useState(false);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find current chapter based on time
  useEffect(() => {
    const chapter = chapters.find(
      (ch) => savedTime >= ch.startTime && savedTime < ch.endTime
    );
    setCurrentChapter(chapter || null);
  }, [savedTime, chapters]);

  // Save progress periodically
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    }, 5000);
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [onTimeUpdate]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setProgress((current / duration) * 100);
    onTimeUpdate(current);
  }, [duration, onTimeUpdate]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
    },
    [duration, onSeek]
  );

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    if (savedTime > 0) {
      videoRef.current.currentTime = savedTime;
    }
  }, [savedTime]);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    onComplete();
  }, [onComplete]);

  const changeSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {}
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div ref={containerRef} style={{ background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      {/* Video Element */}
      <video
        ref={videoRef}
        style={{ width: "100%", display: "block", cursor: "pointer" }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        onClick={togglePlay}
        playsInline
      >
        {videoUrl && <source src={videoUrl} />}
        Your browser does not support the video tag.
      </video>

      {/* No Video Placeholder */}
      {!videoUrl && (
        <div
          style={{
            width: "100%", aspectRatio: "16/9", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0a0a0f, #1a1a2e)",
            color: "var(--muted)", gap: 12,
          }}
          onClick={togglePlay}
        >
          <div style={{ fontSize: 48 }}>▶</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--white)" }}>{title}</div>
          <div style={{ fontSize: 13 }}>Video content coming soon</div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && videoUrl && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: "rgba(0,0,0,.3)", cursor: "pointer",
          }}
          onClick={togglePlay}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "rgba(106,255,240,.9)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#000",
          }}>
            ▶
          </div>
        </div>
      )}

      {/* Current Chapter Indicator */}
      {currentChapter && (
        <div style={{
          position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,.7)",
          padding: "4px 10px", borderRadius: 6, fontSize: 12, color: "var(--neon-cyan)", fontWeight: 600,
        }}>
          {currentChapter.title}
        </div>
      )}

      {/* Controls Bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,.9))",
        padding: "20px 16px 12px",
      }}>
        {/* Progress Bar */}
        <div
          style={{
            width: "100%", height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2,
            cursor: "pointer", marginBottom: 10, position: "relative",
          }}
          onClick={handleSeek}
        >
          <div style={{
            height: "100%", width: `${progress}%`, background: "var(--neon-cyan)",
            borderRadius: 2, transition: "width .1s",
          }} />
          {/* Chapter markers */}
          {chapters.map((ch) => (
            <div
              key={ch.id}
              style={{
                position: "absolute", top: -3,
                left: `${(ch.startTime / duration) * 100}%`,
                width: 2, height: 10, background: "rgba(255,255,255,.4)",
              }}
              title={ch.title}
            />
          ))}
          {/* Bookmark markers */}
          {bookmarks.map((bm, i) => (
            <div
              key={i}
              style={{
                position: "absolute", top: -3,
                left: `${(bm.timestamp / duration) * 100}%`,
                width: 4, height: 10, background: "var(--neon-purple)", borderRadius: 2,
              }}
              title={bm.label || formatTime(bm.timestamp)}
            />
          ))}
        </div>

        {/* Controls Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{ background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={toggleMute} style={{ background: "none", border: "none", color: "white", fontSize: 14, cursor: "pointer" }}>
                {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
              </button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={changeVolume}
                style={{ width: 60, accentColor: "var(--neon-cyan)" }}
              />
            </div>
            {/* Time */}
            <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Speed */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div style={{
                  position: "absolute", bottom: "100%", right: 0, background: "#1a1a2e",
                  border: "1px solid var(--line)", borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 10,
                }}>
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      style={{
                        display: "block", width: "100%", padding: "6px 16px", background: s === playbackSpeed ? "rgba(106,255,240,.15)" : "none",
                        border: "none", color: s === playbackSpeed ? "var(--neon-cyan)" : "white", fontSize: 12, cursor: "pointer", borderRadius: 4, textAlign: "left",
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Bookmark */}
            <button
              onClick={() => onAddBookmark(videoRef.current?.currentTime || 0)}
              style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", fontSize: 14, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
              title="Add bookmark"
            >
              🔖
            </button>
            {/* Note */}
            <button
              onClick={() => onAddNote(videoRef.current?.currentTime || 0)}
              style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", fontSize: 14, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
              title="Add note"
            >
              📝
            </button>
            {/* PiP */}
            <button
              onClick={togglePiP}
              style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", fontSize: 14, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
              title="Picture in Picture"
            >
              🖼
            </button>
            {/* Chapters */}
            <button
              onClick={() => setShowChapters(!showChapters)}
              style={{ background: showChapters ? "rgba(106,255,240,.2)" : "rgba(255,255,255,.1)", border: "none", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 8px", borderRadius: 4 }}
            >
              Chapters
            </button>
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={{ background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>
              {isFullscreen ? "⊡" : "⛶"}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Sidebar */}
      {showChapters && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 60, width: 280,
          background: "rgba(10,10,15,.95)", borderLeft: "1px solid var(--line)",
          overflowY: "auto", padding: 12, zIndex: 5,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--neon-cyan)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
            Chapters
          </div>
          {chapters.sort((a, b) => a.sortOrder - b.sortOrder).map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = ch.startTime;
                onSeek(ch.startTime);
              }}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                background: currentChapter?.id === ch.id ? "rgba(106,255,240,.1)" : "none",
                border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 2,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: currentChapter?.id === ch.id ? 700 : 500, color: currentChapter?.id === ch.id ? "var(--neon-cyan)" : "var(--white)" }}>
                {ch.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {formatTime(ch.startTime)} — {formatTime(ch.endTime)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
