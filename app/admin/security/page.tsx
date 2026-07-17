"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SecurityStats {
  summary: {
    attacks24h: number;
    attacks7d: number;
    attacks30d: number;
    blocked24h: number;
    activeBlocks: number;
    permanentBlocks: number;
  };
  attacksByType: { type: string; _count: number }[];
  topAttackingIps: { ip: string; _count: number }[];
  topTargetedPaths: { path: string; _count: number }[];
  hourlyActivity: { hour: string; count: number }[];
}

interface BlockedIp {
  id: string;
  ip: string;
  reason: string;
  source: string;
  violationCount: number;
  blockedAt: string;
  expiresAt: string | null;
  unblockedAt: string | null;
  notes: string | null;
}

interface AttackLogEntry {
  id: string;
  ip: string;
  type: string;
  path: string;
  method: string;
  userAgent: string | null;
  details: string | null;
  blocked: boolean;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  rate_limit: "#f59e0b",
  blocked_ua: "#ef4444",
  suspicious_path: "#f97316",
  injection: "#dc2626",
  auto_blocked: "#7c3aed",
  manual_blocked: "#6366f1",
};

const typeLabels: Record<string, string> = {
  rate_limit: "Rate Limited",
  blocked_ua: "Bad User-Agent",
  suspicious_path: "Suspicious Path",
  injection: "Injection Attempt",
  auto_blocked: "Auto-Blocked",
  manual_blocked: "Manual Block",
};

export default function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "logs" | "blocked">("overview");
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [blockExpiry, setBlockExpiry] = useState("1h");
  const [logFilter, setLogFilter] = useState({ type: "", ip: "", hours: "24" });
  const [logPage, setLogPage] = useState(1);

  const fetchStats = async () => {
    try {
      const [sRes, bRes, lRes] = await Promise.all([
        fetch("/api/admin/security/stats"),
        fetch("/api/admin/security/blocked-ips?limit=50"),
        fetch(`/api/admin/security/attack-logs?hours=${logFilter.hours}&page=${logPage}${logFilter.type ? `&type=${logFilter.type}` : ""}${logFilter.ip ? `&ip=${logFilter.ip}` : ""}`),
      ]);
      const [s, b, l] = await Promise.all([sRes.json(), bRes.json(), lRes.json()]);
      if (s.success) setStats(s.data);
      if (b.success) setBlockedIps(b.data.ips);
      if (l.success) setAttackLogs(l.data.logs);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    setLogPage(1);
    fetch(`/api/admin/security/attack-logs?hours=${logFilter.hours}&page=1${logFilter.type ? `&type=${logFilter.type}` : ""}${logFilter.ip ? `&ip=${logFilter.ip}` : ""}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAttackLogs(d.data.logs); });
  }, [logFilter]);

  const blockIp = async () => {
    if (!newIp || !newReason) return;
    const expiryMs: Record<string, number> = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000, permanent: 0 };
    const ms = expiryMs[blockExpiry] || 3600000;
    const expiresAt = ms > 0 ? new Date(Date.now() + ms).toISOString() : null;

    await fetch("/api/admin/security/blocked-ips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: newIp, reason: newReason, expiresAt }),
    });
    setNewIp("");
    setNewReason("");
    fetchStats();
  };

  const unblockIp = async (id: string) => {
    await fetch(`/api/admin/security/blocked-ips?id=${id}`, { method: "DELETE" });
    fetchStats();
  };

  const purgeLogs = async () => {
    if (!confirm("Delete attack logs older than 30 days?")) return;
    await fetch("/api/admin/security/attack-logs?olderThanDays=30", { method: "DELETE" });
    fetchStats();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Loading security dashboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 5.5vw", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(9,10,13,.76)", backdropFilter: "blur(18px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>Admin</Link>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>/</span>
          <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 700 }}>Security</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchStats} style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Refresh</button>
          <button onClick={purgeLogs} style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#ef4444", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Purge Old Logs</button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 5.5vw" }}>
        {/* Stats Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Attacks (24h)", value: stats.summary.attacks24h, color: "#ef4444" },
              { label: "Attacks (7d)", value: stats.summary.attacks7d, color: "#f97316" },
              { label: "Attacks (30d)", value: stats.summary.attacks30d, color: "#f59e0b" },
              { label: "Blocked (24h)", value: stats.summary.blocked24h, color: "#7c3aed" },
              { label: "Active Blocks", value: stats.summary.activeBlocks, color: "#6366f1" },
              { label: "Permanent Blocks", value: stats.summary.permanentBlocks, color: "#dc2626" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
                <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value.toLocaleString()}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
          {(["overview", "logs", "blocked"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: "none", border: "none", color: tab === t ? "var(--neon-cyan)" : "var(--muted)", fontSize: 13, fontWeight: 600, padding: "10px 16px", cursor: "pointer", borderBottom: tab === t ? "2px solid var(--neon-cyan)" : "2px solid transparent", marginBottom: -1 }}>
              {t === "overview" ? "Overview" : t === "logs" ? "Attack Logs" : "Blocked IPs"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Attack Types */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Attacks by Type (24h)</h3>
              {stats.attacksByType.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No attacks in the last 24 hours</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stats.attacksByType.map((a) => (
                    <div key={a.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: typeColors[a.type] || "#666", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, flex: 1 }}>{typeLabels[a.type] || a.type}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--white)" }}>{a._count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Attacking IPs */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Attacking IPs (24h)</h3>
              {stats.topAttackingIps.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No attacks in the last 24 hours</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {stats.topAttackingIps.map((a, i) => (
                    <div key={a.ip} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                      <span style={{ color: "var(--muted)", width: 20, textAlign: "right" }}>{i + 1}.</span>
                      <code style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}>{a.ip}</code>
                      <span style={{ fontWeight: 700, color: "#ef4444" }}>{a._count}</span>
                      <button onClick={() => { setNewIp(a.ip); setNewReason("Auto-flagged top attacker"); setTab("blocked"); }}
                        style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#ef4444", padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}>Block</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Targeted Paths */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20, gridColumn: "span 2" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Targeted Paths (24h)</h3>
              {stats.topTargetedPaths.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No attacks in the last 24 hours</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 6 }}>
                  {stats.topTargetedPaths.map((p) => (
                    <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 10px", background: "rgba(255,255,255,.02)", borderRadius: 6 }}>
                      <code style={{ flex: 1, fontFamily: "monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</code>
                      <span style={{ fontWeight: 700, color: "#f97316", flexShrink: 0 }}>{p._count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {tab === "logs" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select value={logFilter.type} onChange={(e) => setLogFilter(f => ({ ...f, type: e.target.value }))}
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>
                <option value="">All Types</option>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input value={logFilter.ip} onChange={(e) => setLogFilter(f => ({ ...f, ip: e.target.value }))} placeholder="Filter by IP..."
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 12px", borderRadius: 6, fontSize: 12, width: 160 }} />
              <select value={logFilter.hours} onChange={(e) => setLogFilter(f => ({ ...f, hours: e.target.value }))}
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>
                <option value="1">Last 1 hour</option>
                <option value="6">Last 6 hours</option>
                <option value="24">Last 24 hours</option>
                <option value="168">Last 7 days</option>
                <option value="720">Last 30 days</option>
              </select>
            </div>

            {/* Log Table */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 120px 80px 1fr 160px 100px 80px", padding: "10px 16px", borderBottom: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                <div>Time</div>
                <div>IP</div>
                <div>Method</div>
                <div>Path</div>
                <div>Type</div>
                <div>User-Agent</div>
                <div>Blocked</div>
              </div>
              {attackLogs.length === 0 ? (
                <div style={{ padding: 24, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>No attack logs found</div>
              ) : (
                attackLogs.map((log) => (
                  <div key={log.id} style={{ display: "grid", gridTemplateColumns: "140px 120px 80px 1fr 160px 100px 80px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 12, alignItems: "center" }}>
                    <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: 11 }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    <code style={{ fontFamily: "monospace", fontSize: 11 }}>{log.ip}</code>
                    <div style={{ color: "var(--muted)" }}>{log.method}</div>
                    <code style={{ fontFamily: "monospace", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.path}</code>
                    <div>
                      <span style={{ background: (typeColors[log.type] || "#666") + "22", color: typeColors[log.type] || "#666", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                        {typeLabels[log.type] || log.type}
                      </span>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.userAgent?.slice(0, 20) || "-"}</div>
                    <div style={{ color: log.blocked ? "#ef4444" : "var(--muted)", fontWeight: 600 }}>{log.blocked ? "Yes" : "No"}</div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1}
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", opacity: logPage === 1 ? 0.4 : 1 }}>Prev</button>
              <span style={{ color: "var(--muted)", fontSize: 12, display: "flex", alignItems: "center" }}>Page {logPage}</span>
              <button onClick={() => setLogPage(p => p + 1)} disabled={attackLogs.length < 50}
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", opacity: attackLogs.length < 50 ? 0.4 : 1 }}>Next</button>
            </div>
          </div>
        )}

        {/* Blocked IPs Tab */}
        {tab === "blocked" && (
          <div>
            {/* Manual Block Form */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Block an IP</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>IP Address</label>
                  <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="192.168.1.1"
                    style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "8px 12px", borderRadius: 6, fontSize: 13, width: 180 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Reason</label>
                  <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="DDoS attack source"
                    style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "8px 12px", borderRadius: 6, fontSize: 13, width: 240 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Duration</label>
                  <select value={blockExpiry} onChange={(e) => setBlockExpiry(e.target.value)}
                    style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", color: "var(--white)", padding: "8px 12px", borderRadius: 6, fontSize: 13 }}>
                    <option value="1h">1 Hour</option>
                    <option value="6h">6 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <button onClick={blockIp} disabled={!newIp || !newReason}
                  style={{ background: "#ef4444", color: "white", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: !newIp || !newReason ? 0.4 : 1 }}>Block IP</button>
              </div>
            </div>

            {/* Blocked IPs List */}
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px 100px 140px 140px 80px", padding: "10px 16px", borderBottom: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                <div>IP</div>
                <div>Reason</div>
                <div>Source</div>
                <div>Violations</div>
                <div>Blocked At</div>
                <div>Expires</div>
                <div>Action</div>
              </div>
              {blockedIps.filter(ip => !ip.unblockedAt).length === 0 ? (
                <div style={{ padding: 24, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>No blocked IPs</div>
              ) : (
                blockedIps.filter(ip => !ip.unblockedAt).map((b) => (
                  <div key={b.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px 100px 140px 140px 80px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.03)", fontSize: 12, alignItems: "center" }}>
                    <code style={{ fontFamily: "monospace", fontSize: 12 }}>{b.ip}</code>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.reason}</div>
                    <div>
                      <span style={{ background: b.source === "manual" ? "rgba(99,102,241,.15)" : "rgba(124,58,237,.15)", color: b.source === "manual" ? "#6366f1" : "#7c3aed", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                        {b.source}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{b.violationCount}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(b.blockedAt).toLocaleString()}</div>
                    <div style={{ color: b.expiresAt ? "var(--muted)" : "#ef4444", fontSize: 11 }}>
                      {b.expiresAt ? new Date(b.expiresAt).toLocaleString() : "Permanent"}
                    </div>
                    <button onClick={() => unblockIp(b.id)}
                      style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", color: "#22c55e", padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Unblock</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
