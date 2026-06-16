import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const body = await req.json();
    const { name, slug, headline, subtitle, ctaText, buttonColor } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.campaign.findUnique({
      where: { organizationId_slug: { organizationId: membership.organizationId, slug: slug.trim() } },
    });
    if (existing) {
      return NextResponse.json({ error: "A campaign with this slug already exists" }, { status: 409 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: membership.organizationId,
        name: name.trim(),
        slug: slug.trim(),
        headline: headline?.trim() || null,
        subtitle: subtitle?.trim() || null,
        ctaText: ctaText?.trim() || "Submit",
        buttonColor: buttonColor || "#7C3AED",
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
