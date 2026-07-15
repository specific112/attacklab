import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, conflict, notFound } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const course = await db.course.findUnique({ where: { id } });
  if (!course) return notFound("Course not found");

  const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } });
  if (existing) return conflict("Already enrolled");

  const enrollment = await db.enrollment.create({
    data: { userId: user.id, courseId: id },
  });

  await db.activityLog.create({
    data: { userId: user.id, action: "ENROLLED_COURSE", details: { courseId: id, courseTitle: course.title } },
  });

  return success(enrollment, 201);
}
