import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

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

    const conversation = await prisma.conversation.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const conversation = await prisma.conversation.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const body = await req.json();
    const { mode, assignedToId, status } = body;

    const data: Prisma.ConversationUpdateInput = {};
    if (mode === "auto" || mode === "manual") data.mode = mode;
    if (assignedToId !== undefined) {
      if (assignedToId === null) {
        data.assignedTo = { disconnect: true };
        data.assignedAt = null;
      } else {
        const member = await prisma.membership.findFirst({
          where: { userId: assignedToId, organizationId: membership.organizationId },
        });
        if (!member) return NextResponse.json({ error: "User not found in organization" }, { status: 400 });
        data.assignedTo = { connect: { id: assignedToId } };
        data.assignedAt = new Date();
      }
    }
    if (status && ["active", "lead_captured", "closed"].includes(status)) data.status = status;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("Failed to update conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}