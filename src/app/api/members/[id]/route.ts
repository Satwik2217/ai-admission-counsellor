import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const currentMembership = await prisma.membership.findFirst({ where: { userId } });
    if (!currentMembership) return NextResponse.json({ error: "No organization found" }, { status: 404 });
    if (currentMembership.role !== "OWNER" && currentMembership.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only owners can manage members" }, { status: 403 });
    }

    const targetMembership = await prisma.membership.findFirst({
      where: { userId: id, organizationId: currentMembership.organizationId },
    });
    if (!targetMembership) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const body = await req.json();
    const { role } = body;

    if (role && (role === "OWNER" || role === "STAFF")) {
      const updated = await prisma.membership.update({
        where: { id: targetMembership.id },
        data: { role },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      });
      return NextResponse.json({ member: updated });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update member:", error);
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

    const currentMembership = await prisma.membership.findFirst({ where: { userId } });
    if (!currentMembership) return NextResponse.json({ error: "No organization found" }, { status: 404 });
    if (currentMembership.role !== "OWNER" && currentMembership.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 });
    }

    if (id === userId) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    const targetMembership = await prisma.membership.findFirst({
      where: { userId: id, organizationId: currentMembership.organizationId },
    });
    if (!targetMembership) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    await prisma.membership.delete({ where: { id: targetMembership.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
