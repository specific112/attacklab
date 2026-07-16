import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");

  if (chapterId) {
    const progress = await db.chapterProgress.findUnique({
      where: { userId_chapterId: { userId: auth.id, chapterId } },
    });
    return success(progress || { isCompleted: false });
  }

  const allProgress = await db.chapterProgress.findMany({
    where: { userId: auth.id },
  });

  return success(allProgress);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { chapterId } = await req.json();
  if (!chapterId) return unauthorized();

  const progress = await db.chapterProgress.upsert({
    where: { userId_chapterId: { userId: auth.id, chapterId } },
    update: { isCompleted: true, completedAt: new Date() },
    create: {
      userId: auth.id,
      chapterId,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  return success(progress);
}
