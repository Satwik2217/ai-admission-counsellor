import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const orgId = membership.organizationId;

    const [
      totalChats,
      leadsCaptured,
      totalLeads,
      totalAppointments,
      recentConversations,
      conversations,
    ] = await Promise.all([
      prisma.conversation.count({ where: { organizationId: orgId } }),
      prisma.conversation.count({ where: { organizationId: orgId, status: "lead_captured" } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.appointment.count({ where: { organizationId: orgId } }),
      prisma.conversation.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, studentName: true, status: true, createdAt: true },
      }),
      prisma.conversation.findMany({
        where: { organizationId: orgId },
        include: {
          messages: {
            where: { role: "user" },
            select: { content: true },
          },
        },
      }),
    ]);

    const hotLeads = await prisma.lead.count({
      where: { organizationId: orgId, category: "hot" },
    });

    const pendingAppointments = await prisma.appointment.count({
      where: { organizationId: orgId, status: "pending" },
    });

    const confirmedAppointments = await prisma.appointment.count({
      where: { organizationId: orgId, status: "confirmed" },
    });

    const conversionRate = totalChats > 0 ? Math.round((leadsCaptured / totalChats) * 100) : 0;

    const wordCounts = new Map<string, number>();
    const questionIndicators = ["what", "how", "why", "when", "where", "which", "can", "do", "is", "are", "?"];
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        const lower = msg.content.toLowerCase().trim();
        if (questionIndicators.some((q) => lower.startsWith(q) || lower.includes(q))) {
          const truncated = lower.length > 80 ? lower.slice(0, 80) + "..." : lower;
          wordCounts.set(truncated, (wordCounts.get(truncated) || 0) + 1);
        }
      }
    }

    const popularQuestions = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    return NextResponse.json({
      totalChats,
      leadsCaptured,
      totalLeads,
      totalAppointments,
      conversionRate,
      hotLeads,
      pendingAppointments,
      confirmedAppointments,
      popularQuestions,
      recentConversations,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
