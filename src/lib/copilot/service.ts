import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { buildCopilotSystemPrompt } from "./prompts";

interface CopilotRequest {
  organizationId: string;
  message: string;
  language?: string;
}

interface CopilotResponse {
  stream: ReadableStream<string>;
}

export async function processCopilotChat(req: CopilotRequest): Promise<CopilotResponse> {
  const { organizationId, message, language } = req;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, greetingMessage: true },
  });
  if (!org) throw new Error("Organization not found");

  const [totalLeads, leadsByStatusResult, totalConversations, activeConversations, recentLeads, recentConversations] =
    await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { id: true },
      }),
      prisma.conversation.count({ where: { organizationId } }),
      prisma.conversation.count({
        where: { organizationId, status: "active" },
      }),
      prisma.lead.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { name: true, status: true, score: true },
      }),
      prisma.conversation.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { studentName: true, status: true, createdAt: true },
      }),
    ]);

  const leadsByStatus: Record<string, number> = {};
  for (const r of leadsByStatusResult) {
    leadsByStatus[r.status] = r._count.id;
  }

  const systemPrompt = buildCopilotSystemPrompt({
    instituteName: org.name,
    totalLeads,
    leadsByStatus,
    totalConversations,
    activeConversations,
    recentLeads,
    recentConversations,
    language,
  });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: message },
  ];

  const provider = getAIProvider();
  const stream = provider.streamChat({
    messages,
    systemPrompt,
    language,
  });

  return { stream };
}
