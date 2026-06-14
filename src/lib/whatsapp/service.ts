import { prisma } from "@/lib/prisma";

const META_API_BASE = "https://graph.facebook.com/v22.0";

export interface WhatsAppMessage {
  from: string;
  content: string;
  messageId: string;
  timestamp: string;
  type: "text" | "interactive" | "button";
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          button?: { payload: string; text: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }>;
      };
    }>;
  }>;
}

export function parseIncomingMessage(payload: WhatsAppWebhookPayload): WhatsAppMessage | null {
  const entry = payload.entry?.[0];
  if (!entry) return null;

  const change = entry.changes?.[0];
  if (!change) return null;

  const value = change.value;
  const message = value.messages?.[0];
  if (!message) return null;

  let content = "";
  if (message.type === "text" && message.text) {
    content = message.text.body;
  } else if (message.type === "button" && message.button) {
    content = message.button.text;
  } else if (message.type === "interactive") {
    const interactive = message.interactive;
    if (interactive?.button_reply) {
      content = interactive.button_reply.title;
    } else if (interactive?.list_reply) {
      content = interactive.list_reply.title;
    }
  }

  if (!content) return null;

  return {
    from: message.from,
    content,
    messageId: message.id,
    timestamp: message.timestamp,
    type: message.type as WhatsAppMessage["type"],
  };
}

export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null): string | null {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }

  return null;
}

export async function getOrgByPhoneNumberId(phoneNumberId: string) {
  return prisma.organization.findFirst({
    where: { whatsappPhoneNumberId: phoneNumberId },
  });
}

export async function sendWhatsAppMessage(params: {
  to: string;
  content: string;
  organizationId: string;
}): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    select: {
      whatsappPhoneNumberId: true,
      whatsappApiToken: true,
    },
  });

  if (!org?.whatsappPhoneNumberId || !org?.whatsappApiToken) {
    console.warn("[WhatsApp] Missing phone number ID or API token for org", params.organizationId);
    return false;
  }

  try {
    const res = await fetch(
      `${META_API_BASE}/${org.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${org.whatsappApiToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.to,
          type: "text",
          text: { body: params.content },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] Failed to send message:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[WhatsApp] Send error:", error);
    return false;
  }
}

export function extractPhoneNumber(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
