import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const history = await db.watchHistory.findMany({
    where: { userId: auth.id },
    include: {
      lesson: {
        select: { id: true, title: true, moduleId: true },
      },
    },
    orderBy: { watchedAt: "desc" },
    take: 20,
  });

  return success(history);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { lessonId, timestamp } = await req.json();
  if (!lessonId || timestamp === undefined) return unauthorized();

  const entry = await db.watchHistory.create({
    data: {
      userId: auth.id,
      lessonId,
      timestamp,
    },
  });

  return success(entry);
}
