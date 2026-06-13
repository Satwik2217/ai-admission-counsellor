import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, duration } = await req.json();

    if (!name?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: "Name and duration are required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const course = await prisma.course.create({
      data: {
        organizationId: membership.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        duration: duration.trim(),
      },
      include: { fees: true },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const courses = await prisma.course.findMany({
      where: { organizationId: membership.organizationId },
      include: { fees: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
