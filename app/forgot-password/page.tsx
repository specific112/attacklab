"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (d.success) setSent(true);
      else setError(d.error || "Failed to send reset email");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <Link href="/" style={{ fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48, textShadow: "0 0 10px rgba(106,255,240,.3)" }}>
        <span style={{ marginRight: 6 }}>◇</span> ATTACKLAB
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card">
        {!sent ? (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Reset password</h1>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Enter your email and we&apos;ll send you a reset link</p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              <button className="button" type="submit" disabled={loading} style={{
                width: "100%", justifyContent: "center", padding: "14px 24px",
                background: "var(--neon-cyan)", color: "var(--bg)", border: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                opacity: loading ? 0.6 : 1
              }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✉</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Check your email</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              We sent a password reset link to {email}
            </p>
          </div>
        )}

        <p style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/login" style={{ color: "var(--neon-cyan)", fontSize: 13 }}>← Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}
