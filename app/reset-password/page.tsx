"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48 }}><span style={{ marginRight: 6 }}>◇</span> ATTACKLAB</Link>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Invalid Link</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>This password reset link is invalid or missing.</p>
          <Link href="/forgot-password" style={{ color: "var(--neon-cyan)", fontSize: 13 }}>Request a new link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const d = await res.json();
      if (d.success) setSuccess(true);
      else setError(d.error || "Reset failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <Link href="/" style={{ fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48 }}><span style={{ marginRight: 6 }}>◇</span> ATTACKLAB</Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card">
        {!success ? (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Set new password</h1>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Choose a strong password for your account</p>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, uppercase, lowercase, number" required />
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
              <button className="button" type="submit" disabled={loading} style={{
                width: "100%", justifyContent: "center", padding: "14px 24px",
                background: "var(--neon-cyan)", color: "var(--bg)", border: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                opacity: loading ? 0.6 : 1
              }}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", color: "var(--neon-green)" }}>Password Reset!</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Your password has been updated successfully.</p>
            <button onClick={() => router.push("/login")} style={{
              background: "var(--neon-cyan)", color: "var(--bg)", border: "none",
              borderRadius: 8, padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer"
            }}>
              Sign In →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
