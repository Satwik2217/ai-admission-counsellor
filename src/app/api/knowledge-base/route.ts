import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, content, category } = await req.json();
    if (!title?.trim() || !content?.trim() || !category?.trim()) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const entry = await prisma.knowledgeBase.create({
      data: {
        organizationId: membership.organizationId,
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create KB entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const where: Record<string, unknown> = { organizationId: membership.organizationId };
    if (category) where.category = category;

    const entries = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to fetch KB entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
