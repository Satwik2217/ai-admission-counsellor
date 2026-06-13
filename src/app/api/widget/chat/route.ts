import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/embeddings/search";
import { extractLeadInfo, mergeLeadInfo } from "@/lib/ai/lead-extraction";

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

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: organization.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { organizationId: organization.id, language: "english" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message.trim(),
      },
    });

    const searchResult = await retrieveContext(organization.id, message);
    const context = searchResult.found ? searchResult.answer : "";
    const provider = getAIProvider();

    const chatMessages = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    chatMessages.push({ role: "user", content: message.trim() });

    const systemPrompt = buildSystemPrompt({
      instituteName: organization.name,
      greetingMessage: organization.greetingMessage || undefined,
      context: context || undefined,
      language: "english",
    });

    let fullResponse = "";
    const stream = provider.streamChat({
      messages: chatMessages,
      systemPrompt,
      context: context || undefined,
      language: "english",
    });

    const reader = stream.getReader();
    const encoder = new TextEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += value;
          controller.enqueue(encoder.encode(value));
        }

        await prisma.message.create({
          data: {
            conversationId: conversation!.id,
            role: "assistant",
            content: fullResponse,
          },
        });

        const extractedLead = extractLeadInfo(message.trim() + "\n" + fullResponse);
        const currentLead = {
          studentName: conversation!.studentName || undefined,
          parentName: conversation!.parentName || undefined,
          phone: conversation!.phone || undefined,
          email: conversation!.email || undefined,
          classField: conversation!.classField || undefined,
          targetExam: conversation!.targetExam || undefined,
        };
        const mergedLead = mergeLeadInfo(currentLead, extractedLead);

        if (Object.values(mergedLead).some((v) => v)) {
          await prisma.conversation.update({
            where: { id: conversation!.id },
            data: {
              studentName: mergedLead.studentName,
              parentName: mergedLead.parentName,
              phone: mergedLead.phone,
              email: mergedLead.email,
              classField: mergedLead.classField,
              targetExam: mergedLead.targetExam,
              status: mergedLead.phone || mergedLead.email ? "lead_captured" : "active",
            },
          });
        }

        controller.close();
      },
    });

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": conversation.id,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Widget chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
