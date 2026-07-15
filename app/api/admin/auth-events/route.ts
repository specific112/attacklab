import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const eventType = searchParams.get("eventType");
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (eventType) where.eventType = eventType;
  if (userId) where.userId = userId;

  const [events, total] = await Promise.all([
    db.authenticationEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.authenticationEvent.count({ where }),
  ]);

  return success({ events, total, page, limit, totalPages: Math.ceil(total / limit) });
}
