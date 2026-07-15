"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../../../components/auth-provider";

interface User {
  id: string; email: string; username: string; displayName: string;
  emailVerified: string | null; isActive: boolean; isSuspended: boolean;
  lastLoginAt: string | null; createdAt: string; avatarUrl?: string; bio?: string;
  roles: { role: { name: string } }[];
  _count: { enrollments: number; authenticationEvents: number; lessonProgress: number; assessmentAttempts: number };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { router.push("/login?redirect=/admin/users"); return; }
  }, [currentUser, authLoading, router]);

  const fetchUsers = (q = "") => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (q) params.set("search", q);
    fetch(`/api/admin/users?${params}`).then(r => r.json()).then(d => {
      if (d.success) { setUsers(d.data.users); setTotal(d.data.total); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (userId: string, action: string, value?: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    if (res.ok) {
      fetchUsers(search);
      setSelectedUser(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}><img src="/favicon.svg" alt="" style={{ width: 24, height: 24 }} /> ATTACKLAB</Link>
          <span style={{ color: "var(--neon-purple)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Admin / Users</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>User Management</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{total} total users registered</p>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchUsers(search)}
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 16px", color: "var(--white)", fontSize: 13, width: 300, outline: "none" }}
          />
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading users...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map(u => (
              <motion.div key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1.5fr 100px 90px 90px 100px 180px",
                  alignItems: "center", gap: 12, padding: "14px 20px",
                  background: "rgba(255,255,255,.02)", border: "1px solid var(--line)",
                  borderRadius: 8, fontSize: 13, cursor: "pointer", transition: ".2s"
                }}
                onClick={() => setSelectedUser(u)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(106,255,240,.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--neon-purple), var(--neon-magenta))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--white)" }}>{u.displayName}</div>
                      <div style={{ color: "var(--muted)", fontSize: 11 }}>@{u.username}</div>
                    </div>
                  </div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                <div>
                  {u.roles.map(r => (
                    <span key={r.role.name} style={{ background: r.role.name === "ADMIN" || r.role.name === "SUPER_ADMIN" ? "rgba(180,78,255,.15)" : "rgba(106,255,240,.1)", color: r.role.name === "ADMIN" || r.role.name === "SUPER_ADMIN" ? "var(--neon-purple)" : "var(--neon-cyan)", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>{r.role.name}</span>
                  ))}
                </div>
                <div style={{ color: u.emailVerified ? "var(--neon-green)" : "#ff6b9d", fontSize: 11 }}>{u.emailVerified ? "Verified" : "Unverified"}</div>
                <div style={{ color: u.isSuspended ? "#ff4d4d" : u.isActive ? "var(--neon-green)" : "var(--muted)", fontSize: 11 }}>{u.isSuspended ? "Suspended" : u.isActive ? "Active" : "Inactive"}</div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {u.isSuspended ? (
                    <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "unsuspend"); }} style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Unsuspend</button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "suspend", "Suspended by admin"); }} style={{ background: "rgba(255,77,77,.1)", color: "#ff4d4d", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Suspend</button>
                  )}
                  {!u.emailVerified && (
                    <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "verify-email"); }} style={{ background: "rgba(161,255,139,.1)", color: "var(--neon-green)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Verify</button>
                  )}
                </div>
              </motion.div>
            ))}
            {users.length === 0 && (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No users found.</p>
            )}
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setSelectedUser(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, maxWidth: 520, width: "100%", maxHeight: "80vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>User Profile</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--neon-purple), var(--neon-magenta))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white" }}>
                {selectedUser.displayName?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--white)" }}>{selectedUser.displayName}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>@{selectedUser.username}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Email", value: selectedUser.email },
                { label: "Role", value: selectedUser.roles.map(r => r.role.name).join(", ") || "Student" },
                { label: "Joined", value: new Date(selectedUser.createdAt).toLocaleDateString() },
                { label: "Last Login", value: selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString() : "Never" },
                { label: "Verified", value: selectedUser.emailVerified ? "Yes" : "No" },
                { label: "Status", value: selectedUser.isSuspended ? "Suspended" : selectedUser.isActive ? "Active" : "Inactive" },
              ].map(field => (
                <div key={field.label}>
                  <div style={{ fontSize: 10, color: "var(--neon-cyan)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{field.label}</div>
                  <div style={{ fontSize: 13, color: "var(--white)" }}>{field.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Courses", value: selectedUser._count.enrollments },
                { label: "Lessons", value: selectedUser._count.lessonProgress },
                { label: "Quizzes", value: selectedUser._count.assessmentAttempts },
                { label: "Logins", value: selectedUser._count.authenticationEvents },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--neon-cyan)" }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {selectedUser.isSuspended ? (
                <button onClick={() => handleAction(selectedUser.id, "unsuspend")} style={{ flex: 1, background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "1px solid rgba(106,255,240,.3)", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Unsuspend User</button>
              ) : (
                <button onClick={() => handleAction(selectedUser.id, "suspend", "Suspended by admin")} style={{ flex: 1, background: "rgba(255,77,77,.1)", color: "#ff4d4d", border: "1px solid rgba(255,77,77,.3)", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Suspend User</button>
              )}
              {!selectedUser.emailVerified && (
                <button onClick={() => handleAction(selectedUser.id, "verify-email")} style={{ flex: 1, background: "rgba(161,255,139,.1)", color: "var(--neon-green)", border: "1px solid rgba(161,255,139,.3)", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Verify Email</button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
