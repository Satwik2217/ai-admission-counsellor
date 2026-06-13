import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const org = searchParams.get("org");

    if (!org) {
      return NextResponse.json({ error: "org parameter is required" }, {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: org },
      select: {
        name: true,
        logo: true,
        greetingMessage: true,
        widgetPrimaryColor: true,
        widgetDarkMode: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    return NextResponse.json({
      name: organization.name,
      logo: organization.logo || null,
      greetingMessage: organization.greetingMessage || "Hi! How can I help you today?",
      primaryColor: organization.widgetPrimaryColor || "#7C3AED",
      darkMode: organization.widgetDarkMode,
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Widget config error:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
