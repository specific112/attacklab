import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const sessions = await db.session.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, ipAddress: true, userAgent: true, lastActiveAt: true, createdAt: true },
    orderBy: { lastActiveAt: "desc" },
  });

  return success(sessions);
}

export async function DELETE(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { sessionId } = await req.json();

  if (sessionId) {
    await db.session.updateMany({ where: { id: sessionId, userId: user.id }, data: { isActive: false } });
  } else {
    await db.session.updateMany({ where: { userId: user.id }, data: { isActive: false } });
  }

  return success({ message: "Session(s) terminated" });
}
