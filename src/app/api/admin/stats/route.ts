import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function isSuperAdmin(email: string): boolean {
  const admins = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalOrganizations,
      totalLeads,
      totalChats,
      totalMessages,
      totalAppointments,
      orgsWithLeads,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.lead.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.appointment.count(),
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          _count: { select: { leads: true, conversations: true, appointments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      totalOrganizations,
      totalLeads,
      totalChats,
      totalMessages,
      totalAppointments,
      organizations: orgsWithLeads.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        createdAt: o.createdAt,
        leads: o._count.leads,
        chats: o._count.conversations,
        appointments: o._count.appointments,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
