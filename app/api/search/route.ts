import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { success, error } from "@/lib/api-response";

const schema = z.object({ q: z.string().min(1).max(80) });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({ q: searchParams.get("q") });
  if (!parsed.success) return error("Invalid query");

  const q = parsed.data.q;

  const [courses, labs] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true, deletedAt: null, title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, slug: true, category: true },
    }),
    db.lab.findMany({
      where: { isPublished: true, title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, slug: true, category: true },
    }),
  ]);

  const results = [
    ...courses.map((c) => ({ title: c.title, kind: `Course · ${c.category}`, href: `/courses/${c.slug}` })),
    ...labs.map((l) => ({ title: l.title, kind: `Lab · ${l.category}`, href: `/labs/${l.slug}` })),
  ];

  return success({ results: results.slice(0, 8) });
}
