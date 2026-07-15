"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string; email: string; username: string; displayName: string;
  emailVerified: string | null; isActive: boolean; isSuspended: boolean;
  lastLoginAt: string | null; createdAt: string;
  roles: { role: { name: string } }[];
  _count: { enrollments: number; authenticationEvents: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (res.ok) fetchUsers(search);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: 16, color: "var(--neon-cyan)", textDecoration: "none" }}>◇ ATTACKLAB</Link>
          <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase" }}>User Management</span>
        </div>
        <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 5.5vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Users</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{total} total users</p>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchUsers(search)}
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--line)", borderRadius: 6, padding: "8px 16px", color: "var(--white)", fontSize: 13, width: 250 }}
          />
        </div>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map(user => (
              <div key={user.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 100px 200px", alignItems: "center", gap: 16, padding: "14px 20px", background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--white)" }}>{user.displayName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>@{user.username}</div>
                </div>
                <div style={{ color: "var(--muted)" }}>{user.email}</div>
                <div>
                  {user.roles.map(r => (
                    <span key={r.role.name} style={{ background: r.role.name === "ADMIN" || r.role.name === "SUPER_ADMIN" ? "rgba(180,78,255,.15)" : "rgba(106,255,240,.1)", color: r.role.name === "ADMIN" || r.role.name === "SUPER_ADMIN" ? "var(--neon-purple)" : "var(--neon-cyan)", fontSize: 10, padding: "2px 6px", borderRadius: 3, marginRight: 4 }}>{r.role.name}</span>
                  ))}
                </div>
                <div style={{ color: user.emailVerified ? "var(--neon-green)" : "#ff6b9d", fontSize: 11 }}>{user.emailVerified ? "Verified" : "Unverified"}</div>
                <div style={{ color: user.isSuspended ? "#ff4d4d" : user.isActive ? "var(--neon-green)" : "var(--muted)", fontSize: 11 }}>{user.isSuspended ? "Suspended" : user.isActive ? "Active" : "Inactive"}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {user.isSuspended ? (
                    <button onClick={() => handleAction(user.id, "unsuspend")} style={{ background: "rgba(106,255,240,.1)", color: "var(--neon-cyan)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Unsuspend</button>
                  ) : (
                    <button onClick={() => handleAction(user.id, "suspend", "Suspended by admin")} style={{ background: "rgba(255,77,77,.1)", color: "#ff4d4d", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Suspend</button>
                  )}
                  {!user.emailVerified && (
                    <button onClick={() => handleAction(user.id, "verify-email")} style={{ background: "rgba(161,255,139,.1)", color: "var(--neon-green)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Verify</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
