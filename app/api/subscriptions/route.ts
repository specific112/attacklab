import { requireAuth } from "@/lib/middleware-utils";
import { db } from "@/lib/db";
import { success, unauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });

  const plans = await db.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return success({ current: subscription, plans });
}
