import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: id } },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  progress: { where: { userId: user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return notFound("Not enrolled");

  let totalLessons = 0;
  let completedLessons = 0;

  for (const mod of enrollment.course.modules) {
    for (const lesson of mod.lessons) {
      totalLessons++;
      if (lesson.progress.some((p) => p.status === "COMPLETED")) {
        completedLessons++;
      }
    }
  }

  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return success({
    enrollment: { id: enrollment.id, status: enrollment.status, enrolledAt: enrollment.enrolledAt },
    progress: { totalLessons, completedLessons, completionPercentage },
    modules: enrollment.course.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      lessons: mod.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        contentType: lesson.contentType,
        completed: lesson.progress.some((p) => p.status === "COMPLETED"),
      })),
    })),
  });
}
