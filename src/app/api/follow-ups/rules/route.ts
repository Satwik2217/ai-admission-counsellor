import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const rules = await prisma.followUpRule.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Failed to fetch follow-up rules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const body = await req.json();
    const { name, trigger, delayHours, channel, template } = body;

    if (!name || !trigger || !delayHours || !template) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["no_response", "lead_not_converted"].includes(trigger)) {
      return NextResponse.json({ error: "Invalid trigger" }, { status: 400 });
    }

    const rule = await prisma.followUpRule.create({
      data: {
        organizationId: membership.organizationId,
        name,
        trigger,
        delayHours: Number(delayHours),
        channel: channel || "WHATSAPP",
        template,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Failed to create follow-up rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
