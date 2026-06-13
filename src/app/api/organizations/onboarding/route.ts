import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: {
        organization: {
          include: {
            courses: {
              include: { fees: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const org = membership.organization;

    return NextResponse.json({
      phone: org.phone || "",
      email: org.email || "",
      website: org.website || "",
      address: org.address || "",
      openingTime: org.openingTime || "",
      closingTime: org.closingTime || "",
      admissionProcess: org.admissionProcess || "",
      documentsRequired: org.documentsRequired || "",
      greetingMessage: org.greetingMessage || "",
      courses: org.courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        duration: c.duration,
        fees: c.fees.map((f) => ({
          id: f.id,
          amount: f.amount,
          discount: f.discount,
        })),
      })),
      onboardingComplete: org.onboardingComplete,
    });
  } catch (error) {
    console.error("Failed to fetch onboarding data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const membership = await prisma.membership.findFirst({
      where: { userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const allowedFields = [
      "phone", "email", "website", "address",
      "openingTime", "closingTime",
      "admissionProcess", "documentsRequired",
      "greetingMessage", "onboardingComplete",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const organization = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: updateData,
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Failed to update onboarding data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
