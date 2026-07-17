import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

// GET /api/admin/security/attack-logs — list attack logs with filters
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const ip = searchParams.get("ip");
  const type = searchParams.get("type");
  const blocked = searchParams.get("blocked");
  const hours = parseInt(searchParams.get("hours") || "24");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};

  if (ip) where.ip = ip;
  if (type) where.type = type;
  if (blocked === "true") where.blocked = true;
  if (blocked === "false") where.blocked = false;

  if (hours > 0) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }

  if (search) {
    where.OR = [
      { ip: { contains: search, mode: "insensitive" } },
      { path: { contains: search, mode: "insensitive" } },
      { userAgent: { contains: search, mode: "insensitive" } },
      { details: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total, stats] = await Promise.all([
    db.attackLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.attackLog.count({ where }),
    // Aggregate stats for the dashboard
    db.attackLog.groupBy({
      by: ["type"],
      _count: true,
      where: {
        createdAt: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Top attacking IPs
  const topIps = await db.attackLog.groupBy({
    by: ["ip"],
    _count: true,
    where: {
      createdAt: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
    },
    orderBy: { _count: { ip: "desc" } },
    take: 10,
  });

  // Hourly breakdown for the last 24h
  const hourly = await db.attackLog.groupBy({
    by: ["createdAt"],
    _count: true,
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  return success({
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      byType: stats,
      topIps,
      hourly,
    },
  });
}

// DELETE /api/admin/security/attack-logs — purge old logs
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const olderThanDays = parseInt(searchParams.get("olderThanDays") || "30");

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await db.attackLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return success({ deleted: result.count });
}
