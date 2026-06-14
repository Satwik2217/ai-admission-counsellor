import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processChatNonStreaming } from "@/lib/chat/service";
import {
  parseIncomingMessage,
  verifyWebhook,
  sendWhatsAppMessage,
  getOrgByPhoneNumberId,
} from "@/lib/whatsapp/service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const result = verifyWebhook(mode, token, challenge);
  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const message = parseIncomingMessage(payload);
    if (!message) {
      return NextResponse.json({ status: "ok" });
    }

    const value = payload.entry?.[0]?.changes?.[0]?.value;
    const phoneNumberId = value?.metadata?.phone_number_id;
    if (!phoneNumberId) {
      return NextResponse.json({ status: "ok" });
    }

    const org = await getOrgByPhoneNumberId(phoneNumberId);
    if (!org) {
      console.warn("[WhatsApp] No organization found for phone number ID:", phoneNumberId);
      return NextResponse.json({ status: "ok" });
    }

    const phoneClean = message.from.replace(/[^0-9]/g, "");

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        organizationId: org.id,
        channel: "WHATSAPP",
        channelId: phoneClean,
        status: { not: "closed" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingConversation?.mode === "manual") {
      await prisma.message.create({
        data: {
          conversationId: existingConversation.id,
          role: "user",
          content: message.content.trim(),
          channel: "WHATSAPP",
        },
      });
      return NextResponse.json({ status: "ok" });
    }

    const result = await processChatNonStreaming({
      organizationId: org.id,
      message: message.content,
      conversationId: existingConversation?.id,
      language: "english",
      channel: "WHATSAPP",
      channelId: phoneClean,
    });

    await sendWhatsAppMessage({
      to: message.from,
      content: result.response,
      organizationId: org.id,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[WhatsApp webhook] Error:", error);
    return NextResponse.json({ status: "ok" });
  }
}
