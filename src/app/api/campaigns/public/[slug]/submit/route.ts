import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore, getCategory } from "@/lib/leads/scoring";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { slug, isActive: true },
      include: { organization: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, phone, email, course } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const score = calculateLeadScore({ phone, email, activityTypes: [], source: "campaign" });
    const category = getCategory(score);

    const lead = await prisma.lead.create({
      data: {
        organizationId: campaign.organizationId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        interestedCourse: course?.trim() || null,
        source: "campaign",
        status: "new",
        score,
        category,
        activities: {
          create: {
            type: "lead_created",
            description: `Submitted via campaign: ${campaign.name}`,
          },
        },
      },
    });

    const submission = await prisma.campaignSubmission.create({
      data: {
        campaignId: campaign.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        course: course?.trim() || null,
        leadId: lead.id,
      },
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { submissionCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
  } catch (error) {
    console.error("Campaign submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
