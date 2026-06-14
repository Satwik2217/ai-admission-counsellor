export type ChannelType = "WEBSITE" | "WHATSAPP";

export interface ChannelConfig {
  type: ChannelType;
}

export interface IncomingMessage {
  channel: ChannelType;
  channelId: string;
  from: string;
  content: string;
  timestamp: Date;
  conversationChannelId?: string;
}

export interface OutgoingMessage {
  to: string;
  content: string;
  channel: ChannelType;
}

export interface ChannelAuth {
  organizationId: string;
  channel: ChannelType;
  credentials: Record<string, string>;
}

export function parseChannelType(value: string): ChannelType {
  if (value === "WHATSAPP") return "WHATSAPP";
  return "WEBSITE";
}
