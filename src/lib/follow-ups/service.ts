import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/service";
import type { ChannelType } from "@/lib/channel/types";

export interface FollowUpResult {
  ruleId: string;
  ruleName: string;
  conversationId: string;
  status: "sent" | "skipped" | "failed";
  error?: string;
}

export async function processFollowUps(organizationId?: string): Promise<FollowUpResult[]> {
  const whereOrg = organizationId ? { organizationId } : {};
  const rules = await prisma.followUpRule.findMany({
    where: { enabled: true, ...whereOrg },
  });

  if (rules.length === 0) return [];

  const results: FollowUpResult[] = [];

  for (const rule of rules) {
    const conversations = await findMatchingConversations(rule);
    for (const conv of conversations) {
      const existing = await prisma.followUpLog.findFirst({
        where: {
          conversationId: conv.id,
          ruleId: rule.id,
          status: { in: ["scheduled", "sent"] },
          scheduledAt: { gte: new Date(Date.now() - rule.delayHours * 60 * 60 * 1000) },
        },
      });
      if (existing) {
        results.push({ ruleId: rule.id, ruleName: rule.name, conversationId: conv.id, status: "skipped" });
        continue;
      }

      const scheduledAt = new Date();
      let status: "sent" | "failed" = "sent";
      let errorMsg: string | undefined;

      if (rule.channel === "WHATSAPP" && conv.channelId && conv.phone) {
        const phoneRaw = conv.phone.replace(/[^0-9]/g, "");
        const phone = phoneRaw.startsWith("91") ? phoneRaw : `91${phoneRaw}`;
        const sent = await sendWhatsAppMessage({
          to: phone,
          content: rule.template,
          organizationId: rule.organizationId,
        });
        if (!sent) {
          status = "failed";
          errorMsg = "WhatsApp send failed";
        }
      }

      await prisma.followUpLog.create({
        data: {
          organizationId: rule.organizationId,
          conversationId: conv.id,
          ruleId: rule.id,
          scheduledAt,
          sentAt: status === "sent" ? scheduledAt : null,
          status,
          error: errorMsg,
        },
      });

      results.push({ ruleId: rule.id, ruleName: rule.name, conversationId: conv.id, status, error: errorMsg });
    }
  }

  return results;
}

async function findMatchingConversations(rule: {
  id: string;
  organizationId: string;
  trigger: string;
  delayHours: number;
  channel: string;
}) {
  const since = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);
  const channelFilter = rule.channel !== "ALL" ? { channel: rule.channel as ChannelType } : {};

  if (rule.trigger === "no_response") {
    const conversations = await prisma.conversation.findMany({
      where: {
        organizationId: rule.organizationId,
        status: { notIn: ["closed"] },
        updatedAt: { lte: since },
        ...channelFilter,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return conversations.filter((c) => {
      const lastMsg = c.messages[0];
      if (!lastMsg) return false;
      return lastMsg.role === "user";
    });
  }

  if (rule.trigger === "lead_not_converted") {
    return prisma.conversation.findMany({
      where: {
        organizationId: rule.organizationId,
        status: { notIn: ["lead_captured", "closed"] },
        updatedAt: { lte: since },
        ...channelFilter,
      },
    });
  }

  return [];
}
