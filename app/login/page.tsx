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
  const [error, setError] = useState(() => searchParams.get("error") || "");
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

        <a href="/api/auth/google" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "12px 24px", background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 14,
          fontWeight: 600, color: "var(--white)", textDecoration: "none", cursor: "pointer",
          transition: ".2s"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
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
