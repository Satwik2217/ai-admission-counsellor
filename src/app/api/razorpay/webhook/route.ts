import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
    }

    const valid = Razorpay.validateWebhookSignature(body, signature, secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event: eventName, payload } = event;

    switch (eventName) {
      case "subscription.activated": {
        const subId = payload.subscription?.entity?.id;
        if (subId) {
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: subId },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }
      case "subscription.charged": {
        const chargedSubId = payload.subscription?.entity?.id;
        if (chargedSubId) {
          const periodEnd = payload.subscription?.entity?.current_end;
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: chargedSubId },
            data: {
              status: "ACTIVE",
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            },
          });
        }
        break;
      }
      case "subscription.completed":
      case "subscription.cancelled": {
        const cancelledSubId = payload.subscription?.entity?.id;
        if (cancelledSubId) {
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: cancelledSubId },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }
      case "subscription.pending":
      case "subscription.paused": {
        const pausedSubId = payload.subscription?.entity?.id;
        if (pausedSubId) {
          await prisma.subscription.updateMany({
            where: { razorpaySubscriptionId: pausedSubId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
