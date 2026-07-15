"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("pending");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      setStatus("loading");
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) { setStatus("success"); setMessage("Email verified! You can now access the platform."); }
          else { setStatus("error"); setMessage(d.error || "Verification failed"); }
        })
        .catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
    }
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (d.success) setMessage("Verification email sent! Check your inbox.");
      else setMessage(d.error || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <Link href="/" style={{ fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48, textShadow: "0 0 10px rgba(106,255,240,.3)" }}>
        <span style={{ marginRight: 6 }}>◇</span> ATTACKLAB
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card" style={{ textAlign: "center" }}>
        {status === "pending" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✉</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Verify your email</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              {email ? `We sent a verification link to ${email}` : "Check your email for the verification link"}
            </p>
            {email && (
              <button onClick={handleResend} disabled={resending} style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "12px 24px", color: "var(--neon-cyan)", fontSize: 13,
                fontWeight: 600, cursor: "pointer", width: "100%", marginBottom: 16
              }}>
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </>
        )}

        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Verifying...</h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Please wait while we verify your email.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", color: "var(--neon-green)" }}>Verified!</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>{message}</p>
            <Link href="/dashboard" style={{
              display: "inline-block", padding: "14px 32px", background: "var(--neon-cyan)",
              color: "var(--bg)", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none"
            }}>
              Go to Dashboard →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✗</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", color: "#ff4d4d" }}>Verification Failed</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>{message}</p>
            {email && (
              <button onClick={handleResend} disabled={resending} style={{
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "12px 24px", color: "var(--neon-cyan)", fontSize: 13,
                fontWeight: 600, cursor: "pointer", width: "100%", marginBottom: 16
              }}>
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            )}
            <Link href="/login" style={{ color: "var(--neon-cyan)", fontSize: 13 }}>← Back to login</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
