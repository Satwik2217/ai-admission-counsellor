import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const entry = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const isMember = entry.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to fetch KB entry:", error);
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
    const { title, content, category } = await req.json();

    const entry = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const isMember = entry.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(title?.trim() && { title: title.trim() }),
        ...(content?.trim() && { content: content.trim() }),
        ...(category?.trim() && { category: category.trim() }),
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error("Failed to update KB entry:", error);
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

    const entry = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const isMember = entry.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.knowledgeBase.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete KB entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
