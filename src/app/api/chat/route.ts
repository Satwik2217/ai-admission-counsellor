import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processChat } from "@/lib/chat/service";
import { ensureMembership } from "@/lib/ensure-membership";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await ensureMembership(userId);

    const { conversationId, message, language } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await processChat({
      organizationId: membership.organizationId,
      message,
      conversationId: conversationId || undefined,
      language: language || "english",
      channel: "WEBSITE",
    });

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": result.conversationId,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
