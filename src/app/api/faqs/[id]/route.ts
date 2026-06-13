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

    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!faq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

    const isMember = faq.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Failed to fetch FAQ:", error);
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
    const { question, answer, category } = await req.json();

    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!faq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

    const isMember = faq.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question?.trim() && { question: question.trim() }),
        ...(answer?.trim() && { answer: answer.trim() }),
        ...(category?.trim() && { category: category.trim() }),
      },
    });

    return NextResponse.json({ faq: updated });
  } catch (error) {
    console.error("Failed to update FAQ:", error);
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

    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: { organization: { include: { memberships: true } } },
    });

    if (!faq) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

    const isMember = faq.organization.memberships.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.fAQ.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
