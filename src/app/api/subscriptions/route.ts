import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isRazorpayConfigured, fetchSubscription } from "@/lib/razorpay/service";
import { getPlanById } from "@/lib/razorpay/plans";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
    });
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const plan = getPlanById(subscription.plan);
    let razorpayStatus: string | null = null;

    if (subscription.razorpaySubscriptionId && isRazorpayConfigured()) {
      try {
        const rpSub = await fetchSubscription(subscription.razorpaySubscriptionId);
        razorpayStatus = rpSub?.status ?? null;
      } catch {
        // Razorpay fetch failed — use DB status
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: plan?.name ?? subscription.plan,
        status: subscription.status,
        razorpayStatus,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
