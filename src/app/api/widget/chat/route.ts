import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processChat } from "@/lib/chat/service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { org, message, conversationId } = await req.json();

    if (!org) {
      return NextResponse.json({ error: "org is required" }, { status: 400, headers: corsHeaders });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400, headers: corsHeaders });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: org },
    });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404, headers: corsHeaders });
    }

    const result = await processChat({
      organizationId: organization.id,
      message,
      conversationId: conversationId || undefined,
      language: "english",
      channel: "WEBSITE",
    });

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": result.conversationId,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Widget chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
