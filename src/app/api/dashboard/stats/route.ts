import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const orgId = membership.organizationId;

    const [
      totalLeads,
      leadsByStatus,
      leadsBySource,
      leadsByCategory,
      activeConversations,
      pendingAppointments,
      confirmedAppointments,
      totalAppointments,
      teamMembers,
      recentConversations,
      recentLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["category"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      prisma.conversation.count({ where: { organizationId: orgId, status: "active" } }),
      prisma.appointment.count({ where: { organizationId: orgId, status: "pending" } }),
      prisma.appointment.count({ where: { organizationId: orgId, status: "confirmed" } }),
      prisma.appointment.count({ where: { organizationId: orgId } }),
      prisma.membership.count({ where: { organizationId: orgId } }),
      prisma.conversation.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, studentName: true, phone: true, status: true, channel: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, score: true, category: true, source: true, createdAt: true },
      }),
    ]);

    const leadsCaptured = await prisma.conversation.count({
      where: { organizationId: orgId, status: "lead_captured" },
    });

    const totalConversations = activeConversations + leadsCaptured;
    const conversionRate = totalConversations > 0
      ? Math.round((leadsCaptured / totalConversations) * 100)
      : 0;

    return NextResponse.json({
      totalLeads,
      leadsByStatus: leadsByStatus.map((r) => ({ status: r.status, count: r._count.id })),
      leadsBySource: leadsBySource.map((r) => ({ source: r.source, count: r._count.id })),
      leadsByCategory: leadsByCategory.map((r) => ({ category: r.category, count: r._count.id })),
      activeConversations,
      leadsCaptured,
      conversionRate,
      pendingAppointments,
      confirmedAppointments,
      totalAppointments,
      teamMembers,
      recentConversations,
      recentLeads,
      organizationName: membership.organization.name,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
