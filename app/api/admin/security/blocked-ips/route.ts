import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden, error } from "@/lib/api-response";

// GET /api/admin/security/blocked-ips — list all blocked IPs
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};
  if (search) {
    where.OR = [
      { ip: { contains: search, mode: "insensitive" } },
      { reason: { contains: search, mode: "insensitive" } },
    ];
  }

  const [ips, total] = await Promise.all([
    db.blockedIp.findMany({
      where,
      skip,
      take: limit,
      orderBy: { blockedAt: "desc" },
    }),
    db.blockedIp.count({ where }),
  ]);

  return success({ ips, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// POST /api/admin/security/blocked-ips — manually block an IP
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const body = await req.json();
  const { ip, reason, expiresAt, notes } = body;

  if (!ip || !reason) {
    return error("IP and reason are required");
  }

  // Check if already blocked
  const existing = await db.blockedIp.findUnique({ where: { ip } });
  if (existing && !existing.unblockedAt) {
    return error("IP is already blocked");
  }

  const blocked = await db.blockedIp.create({
    data: {
      ip,
      reason,
      source: "manual",
      blockedBy: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
    },
  });

  return success(blocked, 201);
}

// DELETE /api/admin/security/blocked-ips — unblock IPs
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const ip = searchParams.get("ip");

  if (!id && !ip) {
    return error("Provide id or ip to unblock");
  }

  const where = id ? { id } : { ip: ip! };
  const existing = await db.blockedIp.findFirst({ where });
  if (!existing) {
    return error("Blocked IP not found");
  }

  await db.blockedIp.update({
    where: { id: existing.id },
    data: { unblockedAt: new Date(), unblockedBy: user.id },
  });

  return success({ unblocked: true });
}
