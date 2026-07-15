import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, notFound } from "@/lib/api-response";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { id } = await params;
  const session = await db.labSession.findFirst({
    where: { userId: user.id, labId: id, status: "RUNNING" },
  });
  if (!session) return notFound("No active lab session found");

  const updated = await db.labSession.update({
    where: { id: session.id },
    data: { status: "STOPPED", stoppedAt: new Date() },
  });

  return success(updated);
}
