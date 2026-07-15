import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true } },
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.count({ where }),
  ]);

  const stats = await db.payment.groupBy({
    by: ["status"],
    _count: true,
    _sum: { amount: true },
  });

  return success({ payments, total, page, limit, totalPages: Math.ceil(total / limit), stats });
}
