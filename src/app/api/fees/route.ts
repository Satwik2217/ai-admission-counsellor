import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, amount, discount } = await req.json();

    if (!courseId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Course ID and valid amount are required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { organization: { include: { memberships: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isMember = course.organization.memberships.some(
      (m) => m.userId === userId
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fee = await prisma.fee.create({
      data: {
        courseId,
        amount,
        discount: discount ?? 0,
      },
    });

    return NextResponse.json({ fee }, { status: 201 });
  } catch (error) {
    console.error("Failed to create fee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, amount, discount } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Fee ID is required" }, { status: 400 });
    }

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: { course: { include: { organization: { include: { memberships: true } } } } },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    const isMember = fee.course.organization.memberships.some(
      (m) => m.userId === userId
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.fee.update({
      where: { id },
      data: {
        amount: amount ?? fee.amount,
        discount: discount ?? fee.discount,
      },
    });

    return NextResponse.json({ fee: updated });
  } catch (error) {
    console.error("Failed to update fee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Fee ID is required" }, { status: 400 });
    }

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: { course: { include: { organization: { include: { memberships: true } } } } },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    const isMember = fee.course.organization.memberships.some(
      (m) => m.userId === userId
    );
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.fee.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete fee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
