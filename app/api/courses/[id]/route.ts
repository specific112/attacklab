import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, notFound, error } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await db.course.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, contentType: true, duration: true, sortOrder: true } } },
      },
      _count: { select: { enrollments: true, modules: true } },
    },
  });

  if (!course) return notFound("Course not found");
  return success(course);
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
