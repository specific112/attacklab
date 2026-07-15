import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      module: { select: { id: true, title: true, courseId: true } },
      progress: { where: { userId: user.id }, select: { status: true, score: true, completedAt: true } },
    },
  });

  if (!lesson) return notFound("Lesson not found");

  return success({
    ...lesson,
    completed: lesson.progress[0]?.status === "COMPLETED" || false,
    score: lesson.progress[0]?.score,
  });
}
