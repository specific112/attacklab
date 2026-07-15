"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../components/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    displayName: "", username: "", email: "", password: "", confirmPassword: "", acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string | boolean) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!form.acceptTerms) { setError("You must accept the terms"); return; }
    setLoading(true);
    try {
      const result = await register(form);
      if (result.error) setError(result.error);
      else router.push("/verify-email?email=" + encodeURIComponent(form.email));
    } finally {
      setLoading(false);
    }
  };

  const passwordInputStyle = { paddingRight: 44 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 22, color: "var(--neon-cyan)", textDecoration: "none", marginBottom: 48, textShadow: "0 0 10px rgba(106,255,240,.3)" }}>
        <img src="/favicon.svg" alt="ATTACKLAB" style={{ width: 36, height: 36 }} />
        ATTACKLAB
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="auth-card">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Create your account</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Start your ethical hacking journey today</p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input type="text" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="John Doe" required />

          <label>Username</label>
          <input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="john_doe" required />

          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" required />

          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              required
              style={passwordInputStyle}
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

          <label>Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
              required
              style={passwordInputStyle}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
                fontSize: 16, padding: 4, lineHeight: 1,
              }}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>

          <label className="checkbox-label" style={{ marginBottom: 20 }}>
            <input type="checkbox" checked={form.acceptTerms} onChange={(e) => update("acceptTerms", e.target.checked)} />
            I agree to the Terms of Service and Privacy Policy
          </label>

          <button className="button" type="submit" disabled={loading} style={{
            width: "100%", justifyContent: "center", padding: "14px 24px",
            background: "var(--neon-cyan)", color: "var(--bg)", border: "none",
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? "Creating account..." : "Create Account"}
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
          Sign up with GitHub
        </a>

        <p style={{ marginTop: 24 }}>
          Already have an account? <Link href="/login" style={{ color: "var(--neon-cyan)" }}>Sign in</Link>
        </p>
      </motion.div>

      <p style={{ marginTop: 40, fontSize: 13, color: "#4a4d5a" }}>
        For more information, <Link href="/contact" style={{ color: "var(--neon-cyan)", textDecoration: "underline" }}>contact us</Link>.
      </p>
    </div>
  );
}
