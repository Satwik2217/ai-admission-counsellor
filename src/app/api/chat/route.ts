import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/embeddings/search";
import { extractLeadInfo, mergeLeadInfo } from "@/lib/ai/lead-extraction";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId, message, language } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const org = membership.organization;

    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, organizationId: org.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: org.id,
          language: language || "english",
        },
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

    const searchResult = await retrieveContext(org.id, message);
    const context = searchResult.found ? searchResult.answer : "";

    const provider = getAIProvider();

    const chatMessages = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    chatMessages.push({ role: "user", content: message.trim() });

    const systemPrompt = buildSystemPrompt({
      instituteName: org.name,
      greetingMessage: org.greetingMessage || undefined,
      context: context || undefined,
      language: language || conversation.language,
    });

    let fullResponse = "";

    const stream = provider.streamChat({
      messages: chatMessages,
      systemPrompt,
      context: context || undefined,
      language: language || conversation.language,
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

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

        const hasLeadInfo = Object.values(mergedLead).some((v) => v);
        if (hasLeadInfo) {
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
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
