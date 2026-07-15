import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden, error } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return forbidden("Admin access required");

  const courses = await db.course.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { modules: true, enrollments: true, assessments: true, labs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(courses);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { courseId, ...updates } = await req.json();

  const course = await db.course.update({ where: { id: courseId }, data: updates });

  await db.auditLog.create({
    data: { userId: admin.id, actorEmail: admin.email, action: "COURSE_UPDATED", resource: "course", resourceId: courseId, details: updates },
  });

  return success(course);
}
