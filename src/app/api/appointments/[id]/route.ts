import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/service";
import { buildConfirmationEmail } from "@/lib/email/templates";

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

    const appointment = await prisma.appointment.findFirst({
      where: { id, organizationId: membership.organizationId },
      include: { lead: { select: { id: true, name: true, phone: true, email: true } } },
    });

    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Failed to fetch appointment:", error);
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

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const existing = await prisma.appointment.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    const body = await req.json();
    const { leadName, leadPhone, leadEmail, date, time, status, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (leadName !== undefined) updateData.leadName = leadName.trim();
    if (leadPhone !== undefined) updateData.leadPhone = leadPhone?.trim() || null;
    if (leadEmail !== undefined) updateData.leadEmail = leadEmail?.trim() || null;
    if (date !== undefined) {
      const d = new Date(date + "T00:00:00Z");
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      updateData.date = d;
    }
    if (time !== undefined) updateData.time = time;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    const org = membership.organization;
    const newEmail = appointment.leadEmail || existing.leadEmail;
    const newStatus = status || existing.status;

    if (newEmail) {
      const displayDate = (appointment.date || existing.date).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      const { subject, html } = buildConfirmationEmail({
        leadName: appointment.leadName,
        date: displayDate,
        time: appointment.time,
        instituteName: org.name,
        institutePhone: org.phone,
        instituteEmail: org.email,
        status: newStatus,
      });

      sendEmail({ to: newEmail, subject, html }).catch(console.error);
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Failed to update appointment:", error);
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

    const existing = await prisma.appointment.findFirst({
      where: { id, organizationId: membership.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    await prisma.appointment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
