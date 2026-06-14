import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const members = await prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    const memberIds = members.map((m) => m.userId);

    const conversationCounts = await prisma.conversation.groupBy({
      by: ["assignedToId"],
      where: { assignedToId: { in: memberIds } },
      _count: { id: true },
    });

    const convMap = new Map(conversationCounts.map((c) => [c.assignedToId, c._count.id]));

    const result = members.map((m) => ({
      id: m.userId,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt,
      userCreatedAt: m.user.createdAt,
      conversationsAssigned: convMap.get(m.userId) || 0,
    }));

    return NextResponse.json({ members: result });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
