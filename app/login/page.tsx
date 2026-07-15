"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (result.error) {
        setError(result.error);
      } else {
        if (result.isAdmin) {
          router.push("/admin");
        } else {
          const redirect = searchParams.get("redirect") || "/dashboard";
          router.push(redirect);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48, textShadow: "0 0 10px rgba(106,255,240,.3)" }}>
        <img src="/favicon.svg" alt="ATTACKLAB" style={{ width: 36, height: 36 }} />
        ATTACKLAB
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to continue your learning journey</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />

          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
                fontSize: 16, padding: 4, lineHeight: 1,
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <Link href="/forgot-password" className="forgot-link" style={{ margin: 0 }}>Forgot password?</Link>
          </div>

          <button className="button" type="submit" disabled={loading} style={{
            width: "100%", justifyContent: "center", padding: "14px 24px",
            background: "var(--neon-cyan)", color: "var(--bg)", border: "none",
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ position: "relative", textAlign: "center", margin: "20px 0" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,.08)" }} />
          <span style={{ position: "relative", background: "var(--panel)", padding: "0 12px", fontSize: 12, color: "var(--muted)" }}>OR</span>
        </div>

        <a href="/api/auth/github" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "12px 24px", background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 14,
          fontWeight: 600, color: "var(--white)", textDecoration: "none", cursor: "pointer",
          transition: ".2s"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          Continue with GitHub
        </a>

        <p style={{ marginTop: 24 }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: "var(--neon-cyan)" }}>Create one</Link>
        </p>
      </motion.div>

      <p style={{ marginTop: 40, fontSize: 13, color: "#4a4d5a" }}>
        For more information, <Link href="/contact" style={{ color: "var(--neon-cyan)", textDecoration: "underline" }}>contact us</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
