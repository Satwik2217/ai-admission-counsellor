export interface AIConfig {
  provider: "gemini" | "groq";
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  systemPrompt: string;
  context?: string;
  language?: string;
}

export interface AIProvider {
  name: string;
  streamChat(params: ChatParams): ReadableStream<string>;
  extractLeadInfo(text: string): Promise<LeadInfo>;
}

export interface LeadInfo {
  studentName?: string;
  parentName?: string;
  phone?: string;
  email?: string;
  classField?: string;
  targetExam?: string;
}
