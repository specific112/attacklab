import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const videos = await db.video.findMany({
    include: {
      lesson: {
        select: {
          title: true,
          module: { select: { title: true, course: { select: { title: true } } } },
        },
      },
      chapters: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(videos);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { lessonId, title, url, duration } = await req.json();

  // Check if lesson already has a video
  const existing = await db.video.findUnique({ where: { lessonId } });
  if (existing) {
    // Update existing
    const video = await db.video.update({
      where: { id: existing.id },
      data: { title, url, duration, status: "READY" },
    });
    return success(video);
  }

  const video = await db.video.create({
    data: {
      lessonId,
      title,
      url,
      duration: duration || 0,
      status: "READY",
    },
  });

  return success(video);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  const { id } = await req.json();

  // Delete chapters first
  await db.videoChapter.deleteMany({ where: { videoId: id } });
  // Delete subtitles
  await db.videoSubtitle.deleteMany({ where: { videoId: id } });
  // Delete transcripts
  await db.videoTranscript.deleteMany({ where: { videoId: id } });
  // Delete video
  await db.video.delete({ where: { id } });

  return success({ message: "Video deleted" });
}
