import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/service";
import { buildConfirmationEmail } from "@/lib/email/templates";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const status = searchParams.get("status") || "";
    const query = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const where: Record<string, unknown> = { organizationId: membership.organizationId };

    if (dateStr) {
      const date = new Date(dateStr + "T00:00:00Z");
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (status) where.status = status;

    if (query) {
      where.OR = [
        { leadName: { contains: query, mode: "insensitive" } },
        { leadPhone: { contains: query, mode: "insensitive" } },
        { leadEmail: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where: where as any }),
      prisma.appointment.findMany({
        where: where as any,
        orderBy: [{ date: "asc" }, { time: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { lead: { select: { id: true, name: true } } },
      }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const body = await req.json();
    const { leadName, leadPhone, leadEmail, date, time, notes, leadId } = body;

    if (!leadName?.trim() || !date || !time) {
      return NextResponse.json({ error: "Name, date, and time are required" }, { status: 400 });
    }

    const bookingDate = new Date(date + "T00:00:00Z");
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        organizationId: membership.organizationId,
        leadId: leadId || null,
        leadName: leadName.trim(),
        leadPhone: leadPhone?.trim() || null,
        leadEmail: leadEmail?.trim() || null,
        date: bookingDate,
        time,
        status: "pending",
        notes: notes?.trim() || null,
      },
    });

    const org = membership.organization;
    const displayDate = bookingDate.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (appointment.leadEmail) {
      const { subject, html } = buildConfirmationEmail({
        leadName: appointment.leadName,
        date: displayDate,
        time: appointment.time,
        instituteName: org.name,
        institutePhone: org.phone,
        instituteEmail: org.email,
        status: "pending",
      });

      sendEmail({ to: appointment.leadEmail, subject, html }).catch(console.error);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
