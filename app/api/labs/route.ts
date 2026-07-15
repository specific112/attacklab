import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  const labs = await db.lab.findMany({
    where,
    select: {
      id: true, title: true, slug: true, description: true, difficulty: true,
      category: true, objectives: true, imageUrl: true, timeoutMinutes: true, isPremium: true,
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return success(labs);
}
