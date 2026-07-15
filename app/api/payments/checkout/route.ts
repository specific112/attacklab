import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-utils";
import { success, unauthorized, error } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { planSlug, billingCycle = "monthly" } = await req.json();
  if (!planSlug) return error("Plan slug is required");

  const plan = await db.subscriptionPlan.findUnique({ where: { slug: planSlug } });
  if (!plan) return error("Invalid plan");

  if (plan.priceMonthly === 0) {
    const existingSub = await db.subscription.findUnique({ where: { userId: user.id } });
    if (existingSub) return error("Already subscribed");

    const freePlan = await db.subscriptionPlan.findUnique({ where: { slug: "free" } });
    await db.subscription.create({
      data: { userId: user.id, planId: freePlan!.id, status: "ACTIVE" },
    });
    return success({ message: "Subscribed to free plan" });
  }

  const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  if (!amount) return error("Invalid billing cycle for this plan");

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      amount,
      currency: plan.currency,
      status: "PENDING",
      provider: "stripe",
      description: `${plan.name} - ${billingCycle}`,
    },
  });

  // In production, create a Stripe checkout session here
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const session = await stripe.checkout.sessions.create({...});

  return success({
    paymentId: payment.id,
    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${payment.id}`,
    amount,
    currency: plan.currency,
  });
}
