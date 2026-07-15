import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound, error } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const lab = await db.lab.findUnique({ where: { id } });
  if (!lab) return notFound("Lab not found");

  const activeSessions = await db.labSession.count({
    where: { userId: user.id, status: "RUNNING" },
  });
  const maxConcurrent = parseInt(process.env.LAB_MAX_CONCURRENT_SESSIONS || "3");
  if (activeSessions >= maxConcurrent) {
    return error(`Maximum concurrent lab sessions (${maxConcurrent}) reached`);
  }

  const existing = await db.labSession.findFirst({
    where: { userId: user.id, labId: id, status: "RUNNING" },
  });
  if (existing) return success(existing);

  const expiresAt = new Date(Date.now() + lab.timeoutMinutes * 60 * 1000);
  const port = 10000 + Math.floor(Math.random() * 50000);

  const session = await db.labSession.create({
    data: {
      userId: user.id,
      labId: id,
      status: "RUNNING",
      port,
      startedAt: new Date(),
      expiresAt,
    },
  });

  await db.labProgress.upsert({
    where: { userId_labId: { userId: user.id, labId: id } },
    update: { status: "IN_PROGRESS" },
    create: { userId: user.id, labId: id, status: "IN_PROGRESS" },
  });

  await db.activityLog.create({
    data: { userId: user.id, action: "LAB_STARTED", details: { labId: id, labTitle: lab.title } },
  });

  return success(session, 201);
}
