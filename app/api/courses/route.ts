import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { requireAuth, requireAdmin } from "@/lib/middleware-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { isPublished: true, deletedAt: null };
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const courses = await db.course.findMany({
    where,
    select: {
      id: true, title: true, slug: true, description: true, shortDescription: true,
      thumbnailUrl: true, difficulty: true, category: true, instructorName: true,
      isPremium: true, estimatedHours: true, objectives: true,
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return success(courses);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return error("Admin access required", 403);

  const body = await req.json();
  const course = await db.course.create({
    data: {
      title: body.title,
      slug: body.slug,
      description: body.description,
      shortDescription: body.shortDescription,
      difficulty: body.difficulty || "BEGINNER",
      category: body.category,
      isPremium: body.isPremium || false,
      objectives: body.objectives || [],
      prerequisites: body.prerequisites || [],
      estimatedHours: body.estimatedHours,
    },
  });

  return success(course, 201);
}
