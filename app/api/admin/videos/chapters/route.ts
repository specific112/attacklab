import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { videoId, title, startTime, endTime } = await req.json();

  // Get next sort order
  const lastChapter = await db.videoChapter.findFirst({
    where: { videoId },
    orderBy: { sortOrder: "desc" },
  });

  const chapter = await db.videoChapter.create({
    data: {
      videoId,
      title,
      startTime: startTime || 0,
      endTime: endTime || 0,
      sortOrder: (lastChapter?.sortOrder || -1) + 1,
    },
  });

  return success(chapter);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { id } = await req.json();
  await db.videoChapter.delete({ where: { id } });

  return success({ message: "Chapter deleted" });
}
