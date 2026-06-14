import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Number(searchParams.get("offset")) || 0;

    const where: Prisma.FollowUpLogWhereInput = { organizationId: membership.organizationId };
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.followUpLog.findMany({
        where,
        include: {
          rule: { select: { name: true } },
          conversation: { select: { id: true, studentName: true, phone: true, channel: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.followUpLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("Failed to fetch follow-up logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
