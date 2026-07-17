import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

// GET /api/admin/security/stats — security dashboard stats
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAttacks24h,
    totalAttacks7d,
    totalAttacks30d,
    blockedAttacks24h,
    activeBlocks,
    permanentBlocks,
    attacksByType24h,
    topAttackingIps24h,
    topTargetedPaths24h,
    attacksByHour24h,
  ] = await Promise.all([
    db.attackLog.count({ where: { createdAt: { gte: last24h } } }),
    db.attackLog.count({ where: { createdAt: { gte: last7d } } }),
    db.attackLog.count({ where: { createdAt: { gte: last30d } } }),
    db.attackLog.count({ where: { createdAt: { gte: last24h }, blocked: true } }),
    db.blockedIp.count({ where: { unblockedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
    db.blockedIp.count({ where: { unblockedAt: null, expiresAt: null } }),
    db.attackLog.groupBy({
      by: ["type"],
      _count: true,
      where: { createdAt: { gte: last24h } },
      orderBy: { _count: { type: "desc" } },
    }),
    db.attackLog.groupBy({
      by: ["ip"],
      _count: true,
      where: { createdAt: { gte: last24h } },
      orderBy: { _count: { ip: "desc" } },
      take: 10,
    }),
    db.attackLog.groupBy({
      by: ["path"],
      _count: true,
      where: { createdAt: { gte: last24h } },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    // Simplified hourly: get all logs in last 24h and bucket by hour in JS
    db.attackLog.findMany({
      where: { createdAt: { gte: last24h } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Bucket attacks by hour
  const hourlyBuckets: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    const h = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const key = h.toISOString().slice(0, 13) + ":00";
    hourlyBuckets[key] = 0;
  }
  for (const log of attacksByHour24h) {
    const key = log.createdAt.toISOString().slice(0, 13) + ":00";
    if (key in hourlyBuckets) hourlyBuckets[key]++;
  }

  return success({
    summary: {
      attacks24h: totalAttacks24h,
      attacks7d: totalAttacks7d,
      attacks30d: totalAttacks30d,
      blocked24h: blockedAttacks24h,
      activeBlocks,
      permanentBlocks,
    },
    attacksByType: attacksByType24h,
    topAttackingIps: topAttackingIps24h,
    topTargetedPaths: topTargetedPaths24h,
    hourlyActivity: Object.entries(hourlyBuckets).map(([hour, count]) => ({ hour, count })),
  });
}
