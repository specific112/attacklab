import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  const where: Record<string, unknown> = { userId: auth.id };
  if (lessonId) where.lessonId = lessonId;

  const bookmarks = await db.userBookmark.findMany({
    where,
    orderBy: { timestamp: "asc" },
  });

  return success(bookmarks);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { lessonId, timestamp, label } = await req.json();
  if (!lessonId || timestamp === undefined) return unauthorized();

  const bookmark = await db.userBookmark.upsert({
    where: { userId_lessonId_timestamp: { userId: auth.id, lessonId, timestamp } },
    update: { label },
    create: {
      userId: auth.id,
      lessonId,
      timestamp,
      label,
    },
  });

  await db.userActivity.create({
    data: {
      userId: auth.id,
      type: "BOOKMARK_CREATE",
      details: { lessonId, timestamp },
      xpEarned: 1,
    },
  });

  return success(bookmark);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { id } = await req.json();
  if (!id) return unauthorized();

  await db.userBookmark.deleteMany({
    where: { id, userId: auth.id },
  });

  return success({ message: "Bookmark deleted" });
}
