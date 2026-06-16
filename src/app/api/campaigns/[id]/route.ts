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

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const campaign = await prisma.campaign.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
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

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const existing = await prisma.campaign.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.headline !== undefined) updateData.headline = body.headline?.trim() || null;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle?.trim() || null;
    if (body.ctaText !== undefined) updateData.ctaText = body.ctaText?.trim() || "Submit";
    if (body.buttonColor !== undefined) updateData.buttonColor = body.buttonColor;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Failed to update campaign:", error);
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

    const existing = await prisma.campaign.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
