import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore, getCategory } from "@/lib/leads/scoring";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/constants";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = { organizationId: membership.organizationId };

    if (status) where.status = status;
    if (source) where.source = source;
    if (category) where.category = category;

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { interestedCourse: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where: where as any }),
      prisma.lead.findMany({
        where: where as any,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { notes: true, activities: true } },
        },
      }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { user: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const body = await req.json();
    const { name, phone, email, interestedCourse, source, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const score = calculateLeadScore({ phone, email, activityTypes: [], source });
    const category = getCategory(score);

    const lead = await prisma.lead.create({
      data: {
        organizationId: membership.organizationId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        interestedCourse: interestedCourse?.trim() || null,
        source: source || "direct",
        status: status || "new",
        score,
        category,
        activities: {
          create: {
            type: LEAD_ACTIVITY_TYPES.LEAD_CREATED,
            description: `Lead created by ${membership.user.firstName || membership.user.email}`,
          },
        },
      },
      include: {
        _count: { select: { notes: true, activities: true } },
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
