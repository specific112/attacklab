import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sig = req.headers.get("stripe-signature");

    // In production, verify webhook signature with stripe:
    // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    const event = body;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await db.payment.updateMany({
          where: { id: session.metadata?.paymentId },
          data: { status: "COMPLETED", providerTxId: session.payment_intent },
        });

        const payment = await db.payment.findUnique({ where: { id: session.metadata?.paymentId } });
        if (payment?.planId && payment?.userId) {
          await db.subscription.upsert({
            where: { userId: payment.userId },
            update: { planId: payment.planId, status: "ACTIVE" },
            create: { userId: payment.userId, planId: payment.planId, status: "ACTIVE" },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await db.payment.updateMany({
          where: { providerTxId: invoice.payment_intent },
          data: { status: "FAILED", failureReason: invoice.last_finalization_error?.message },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await db.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "CANCELED" },
        });
        break;
      }
    }

    return success({ received: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return error("Webhook processing failed", 500);
  }
}
