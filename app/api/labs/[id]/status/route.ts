import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized } from "@/lib/api-response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await db.labSession.findFirst({
    where: { userId: user.id, labId: id, status: "RUNNING" },
    select: { id: true, status: true, port: true, startedAt: true, expiresAt: true },
  });

  const progress = await db.labProgress.findUnique({
    where: { userId_labId: { userId: user.id, labId: id } },
  });

  return success({ session, progress });
}
