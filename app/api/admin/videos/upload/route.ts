import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, forbidden } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return forbidden("Admin access required");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const lessonId = formData.get("lessonId") as string;
    const title = formData.get("title") as string;

    if (!file || !lessonId) {
      return success({ success: false, error: "Missing file or lesson ID" });
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      return success({ success: false, error: "Invalid file type. Please upload MP4, WebM, OGG, or MOV files." });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return success({ success: false, error: "File too large. Maximum size is 500MB." });
    }

    // Convert file to buffer and store as base64 data URL
    // For production, use Vercel Blob, S3, or similar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "video/mp4";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // For now, store the file as a data URL
    // In production, you'd upload to Vercel Blob or S3
    const videoUrl = dataUrl;

    // Check if lesson already has a video
    const existing = await db.video.findUnique({ where: { lessonId } });
    let video;

    if (existing) {
      video = await db.video.update({
        where: { id: existing.id },
        data: {
          title: title || file.name,
          url: videoUrl,
          fileSize: file.size,
          status: "READY",
        },
      });
    } else {
      video = await db.video.create({
        data: {
          lessonId,
          title: title || file.name,
          url: videoUrl,
          fileSize: file.size,
          status: "READY",
        },
      });
    }

    return success({ success: true, data: video });
  } catch (error) {
    console.error("Upload error:", error);
    return success({ success: false, error: "Upload failed. Please try again." });
  }
}
