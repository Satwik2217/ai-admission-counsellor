import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/appointments/slots";

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
    if (!dateStr) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    const date = new Date(dateStr + "T00:00:00Z");
    if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

    const org = membership.organization;
    const openingTime = org.openingTime || "09:00";
    const closingTime = org.closingTime || "17:00";
    const duration = org.appointmentDuration || 60;
    const maxBookings = org.maxBookingsPerSlot || 1;
    const workingDays: number[] = org.workingDays ? JSON.parse(org.workingDays) : [1, 2, 3, 4, 5, 6];

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.groupBy({
      by: ["time"],
      where: {
        organizationId: org.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["cancelled"] },
      },
      _count: { id: true },
    });

    const existing = existingAppointments.map((e) => ({
      time: e.time,
      count: e._count.id,
    }));

    const slots = generateTimeSlots(date, {
      openingTime,
      closingTime,
      duration,
      maxBookings,
      workingDays,
    }, existing);

    return NextResponse.json({
      date: dateStr,
      slots,
      isWorkingDay: workingDays.includes(date.getDay()),
    });
  } catch (error) {
    console.error("Failed to get slots:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
