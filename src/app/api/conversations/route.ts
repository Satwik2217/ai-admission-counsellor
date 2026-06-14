import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    const where: Prisma.ConversationWhereInput = { organizationId: membership.organizationId };
    if (channel && (channel === "WEBSITE" || channel === "WHATSAPP")) where.channel = channel;
    if (status) where.status = status;
    if (assignedTo === "unassigned") where.assignedToId = null;
    else if (assignedTo === "me") where.assignedToId = userId;
    else if (assignedTo) where.assignedToId = assignedTo;

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = conversations.map((c) => ({
      id: c.id,
      studentName: c.studentName,
      phone: c.phone,
      email: c.email,
      channel: c.channel,
      status: c.status,
      mode: c.mode,
      language: c.language,
      assignedTo: c.assignedTo,
      lastMessage: c.messages[0]?.content || "",
      messageCount: c._count.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ conversations: mapped });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
