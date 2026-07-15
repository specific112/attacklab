import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return success(notifications);
}

export async function PUT() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return success({ message: "Notifications marked as read" });
}
