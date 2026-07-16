import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, notFound, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();

  const course = await db.course.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              video: {
                include: { chapters: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true, modules: true } },
    },
  });

  if (!course) return notFound("Course not found");

  // Calculate completion status for each lesson
  let completedLessonIds: Set<string> = new Set();
  if (auth) {
    const completions = await db.lessonProgress.findMany({
      where: { userId: auth.id, lessonId: { in: course.modules.flatMap(m => m.lessons.map(l => l.id)) }, status: "COMPLETED" },
      select: { lessonId: true },
    });
    completedLessonIds = new Set(completions.map(c => c.lessonId));
  }

  // Transform lessons to include completed status
  const courseWithCompletion = {
    ...course,
    modules: course.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        contentType: lesson.contentType,
        duration: lesson.duration,
        sortOrder: lesson.sortOrder,
        completed: completedLessonIds.has(lesson.id),
        video: lesson.video,
      })),
    })),
  };

  return success(courseWithCompletion);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const course = await db.course.update({
    where: { id },
    data: body,
  });
  return success(course);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.course.update({ where: { id }, data: { deletedAt: new Date() } });
  return success({ message: "Course archived" });
}
