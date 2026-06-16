import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  isRazorpayConfigured,
  createSubscription,
} from "@/lib/razorpay/service";
import { getPlanById } from "@/lib/razorpay/plans";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const plan = getPlanById(planId);
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: "Invalid or free plan" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    let subscription = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: membership.organizationId,
          status: "INACTIVE",
          plan: "free",
        },
      });
    }

    const result = await createSubscription({
      planId: plan.id,
      totalCount: 12,
      notes: { organizationId: membership.organizationId },
    });
    if (!result) {
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        razorpaySubscriptionId: result.id,
        plan: planId,
      },
    });

    return NextResponse.json({
      subscriptionId: result.id,
      shortUrl: result.shortUrl,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
