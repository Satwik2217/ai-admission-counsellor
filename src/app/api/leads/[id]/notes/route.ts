import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const notes = await prisma.leadNote.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const [note] = await Promise.all([
      prisma.leadNote.create({
        data: {
          leadId: id,
          content: content.trim(),
          authorId: userId,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          type: LEAD_ACTIVITY_TYPES.NOTE_ADDED,
          description: `Note added by ${membership.user.firstName || membership.user.email}`,
          metadata: { notePreview: content.trim().slice(0, 100) },
        },
      }),
    ]);

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
