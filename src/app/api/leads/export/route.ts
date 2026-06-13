import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const leads = await prisma.lead.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Interested Course",
      "Source",
      "Status",
      "Score",
      "Category",
      "Created At",
      "Updated At",
    ];

    const rows = leads.map((lead) => [
      escapeCsv(lead.name),
      escapeCsv(lead.phone || ""),
      escapeCsv(lead.email || ""),
      escapeCsv(lead.interestedCourse || ""),
      escapeCsv(lead.source),
      escapeCsv(lead.status),
      String(lead.score),
      escapeCsv(lead.category),
      lead.createdAt.toISOString(),
      lead.updatedAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
