import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore, getCategory } from "@/lib/leads/scoring";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { notes: true, activities: true } },
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Failed to fetch lead:", error);
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

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { user: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const existing = await prisma.lead.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: { activities: true },
    });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const body = await req.json();
    const { name, phone, email, interestedCourse, source, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (interestedCourse !== undefined) updateData.interestedCourse = interestedCourse?.trim() || null;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;

    const newPhone = updateData.phone !== undefined ? updateData.phone as string | null : existing.phone;
    const newEmail = updateData.email !== undefined ? updateData.email as string | null : existing.email;
    const newStatus = updateData.status !== undefined ? updateData.status as string : existing.status;

    const activityTypes = existing.activities.map((a) => a.type);
    const lastActivity = existing.activities.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0]?.createdAt;
    const score = calculateLeadScore({
      phone: newPhone,
      email: newEmail,
      activityTypes,
      source: updateData.source as string | undefined ?? existing.source,
      lastActivityAt: lastActivity ?? existing.updatedAt,
    });
    const category = getCategory(score);

    updateData.score = score;
    updateData.category = category;

    const activityDescriptions: string[] = [];
    if (status !== undefined && status !== existing.status) {
      activityDescriptions.push(
        `Status changed from "${existing.status}" to "${status}"`
      );
    }
    if (phone !== undefined && phone !== existing.phone) {
      activityDescriptions.push("Phone number updated");
    }
    if (email !== undefined && email !== existing.email) {
      activityDescriptions.push("Email address updated");
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        activities: activityDescriptions.length > 0
          ? {
              create: activityDescriptions.map((desc) => ({
                type: LEAD_ACTIVITY_TYPES.LEAD_UPDATED,
                description: desc,
              })),
            }
          : undefined,
      },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        activities: { orderBy: { createdAt: "desc" } },
        _count: { select: { notes: true, activities: true } },
      },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Failed to update lead:", error);
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
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const existing = await prisma.lead.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
