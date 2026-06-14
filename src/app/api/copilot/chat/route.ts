import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { processCopilotChat } from "@/lib/copilot/service";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const { message, language } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await processCopilotChat({
      organizationId: membership.organizationId,
      message,
      language: language || "english",
    });

    return new NextResponse(result.stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Copilot error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
