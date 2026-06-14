import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

async function getRule(organizationId: string, id: string) {
  return prisma.followUpRule.findFirst({
    where: { id, organizationId },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const rule = await getRule(membership.organizationId, id);
    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Failed to fetch rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const existing = await getRule(membership.organizationId, id);
    if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    const body = await req.json();
    const { name, trigger, delayHours, channel, template, enabled } = body;

    const data: Prisma.FollowUpRuleUpdateInput = {};
    if (name) data.name = name;
    if (trigger && ["no_response", "lead_not_converted"].includes(trigger)) data.trigger = trigger;
    if (delayHours) data.delayHours = Number(delayHours);
    if (channel) data.channel = channel;
    if (template) data.template = template;
    if (typeof enabled === "boolean") data.enabled = enabled;

    const rule = await prisma.followUpRule.update({
      where: { id },
      data,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Failed to update rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const existing = await getRule(membership.organizationId, id);
    if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    await prisma.followUpRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
