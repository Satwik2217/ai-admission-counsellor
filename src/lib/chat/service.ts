import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/embeddings/search";
import { extractLeadInfo, mergeLeadInfo } from "@/lib/ai/lead-extraction";
import type { ChannelType } from "@/lib/channel/types";

export interface ChatRequest {
  organizationId: string;
  message: string;
  conversationId?: string;
  language?: string;
  channel: ChannelType;
  channelId?: string;
}

export interface ChatResponse {
  conversationId: string;
  fullResponse: string;
  stream: ReadableStream<Uint8Array>;
}

export async function processChat(req: ChatRequest): Promise<ChatResponse> {
  const { organizationId, message, conversationId, language, channel, channelId } = req;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) throw new Error("Organization not found");

  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) throw new Error("Conversation not found");
  } else {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        channel,
        channelId: channelId || null,
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
      channel,
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
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream<Uint8Array>({
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
          channel,
        },
      });

      const extractedLead = await extractLeadInfo(message.trim() + "\n" + fullResponse);
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

  return {
    conversationId: conversation.id,
    fullResponse,
    stream: responseStream,
  };
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export async function processChatNonStreaming(req: ChatRequest): Promise<{ conversationId: string; response: string }> {
  const result = await processChat(req);

  const reader = result.stream.getReader();
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const text = decoder.decode(concatUint8Arrays(chunks));

  return {
    conversationId: result.conversationId,
    response: text,
  };
}
