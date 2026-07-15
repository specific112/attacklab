import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const lesson = await db.lesson.findUnique({ where: { id }, select: { id: true, moduleId: true } });
  if (!lesson) return notFound("Lesson not found");

  const progress = await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: id } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId: user.id, lessonId: id, status: "COMPLETED", completedAt: new Date() },
  });

  await db.activityLog.create({
    data: { userId: user.id, action: "LESSON_COMPLETED", details: { lessonId: id } },
  });

  // Update learning streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const streak = await db.learningStreak.findUnique({ where: { userId: user.id } });
  if (!streak) {
    await db.learningStreak.create({ data: { userId: user.id, currentStreak: 1, longestStreak: 1, lastActiveDate: today } });
  } else {
    const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
    lastActive?.setHours(0, 0, 0, 0);
    const diff = lastActive ? Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const newStreak = diff === 1 ? streak.currentStreak + 1 : diff === 0 ? streak.currentStreak : 1;
    await db.learningStreak.update({
      where: { userId: user.id },
      data: { currentStreak: newStreak, longestStreak: Math.max(newStreak, streak.longestStreak), lastActiveDate: today },
    });
  }

  return success(progress);
}
