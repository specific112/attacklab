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

  const notes = await db.userNote.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return success(notes);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { lessonId, title, content, timestamp } = await req.json();
  if (!lessonId || !content) return unauthorized();

  const note = await db.userNote.create({
    data: {
      userId: auth.id,
      lessonId,
      title,
      content,
      timestamp: timestamp || undefined,
    },
  });

  await db.userActivity.create({
    data: {
      userId: auth.id,
      type: "NOTE_CREATE",
      details: { lessonId, noteId: note.id },
      xpEarned: 2,
    },
  });

  return success(note);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { id, title, content, isPinned } = await req.json();
  if (!id) return unauthorized();

  const note = await db.userNote.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(isPinned !== undefined && { isPinned }),
    },
  });

  return success(note);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { id } = await req.json();
  if (!id) return unauthorized();

  await db.userNote.deleteMany({
    where: { id, userId: auth.id },
  });

  return success({ message: "Note deleted" });
}
