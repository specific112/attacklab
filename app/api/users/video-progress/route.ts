import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  if (lessonId) {
    const progress = await db.videoProgress.findUnique({
      where: { userId_lessonId: { userId: auth.id, lessonId } },
    });
    return success(progress || { currentTime: 0, watchedPercent: 0, isCompleted: false });
  }

  const allProgress = await db.videoProgress.findMany({
    where: { userId: auth.id },
    include: { lesson: { select: { id: true, title: true, moduleId: true } } },
    orderBy: { lastWatchedAt: "desc" },
  });

  return success(allProgress);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { lessonId, currentTime, duration } = await req.json();
  if (!lessonId) return unauthorized();

  const watchedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isCompleted = watchedPercent >= 90;

  const progress = await db.videoProgress.upsert({
    where: { userId_lessonId: { userId: auth.id, lessonId } },
    update: {
      currentTime,
      duration,
      watchedPercent,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
      lastWatchedAt: new Date(),
      totalTimeSpent: { increment: 5 },
    },
    create: {
      userId: auth.id,
      lessonId,
      currentTime,
      duration,
      watchedPercent,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    },
  });

  // Log activity
  if (watchedPercent > 0) {
    await db.userActivity.create({
      data: {
        userId: auth.id,
        type: "VIDEO_WATCH",
        details: { lessonId, currentTime, watchedPercent },
        xpEarned: 1,
      },
    });
  }

  return success(progress);
}
