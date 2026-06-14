import type { AIProvider, AIConfig, ChatParams, LeadInfo } from "./types";

export class GroqProvider implements AIProvider {
  name = "groq";
  private apiKey: string;
  private model: string;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  streamChat(params: ChatParams): ReadableStream<string> {
    const { messages, systemPrompt, context } = params;

    const fullSystemPrompt = context
      ? `${systemPrompt}\n\nRELEVANT INFORMATION:\n${context}`
      : systemPrompt;

    const apiMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const apiKey = this.apiKey;
    const model = this.model;

    return new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              stream: true,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(`\n\nError: API request failed (${res.status}): ${errText}`);
            controller.close();
            return;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            controller.enqueue("\n\nError: No response stream");
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch {
                // skip malformed JSON
              }
            }
          }

          controller.close();
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(`\n\nError: ${errMsg}`);
          controller.close();
        }
      },
    });
  }

  async extractLeadInfo(text: string): Promise<LeadInfo> {
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: `You are a lead information extractor. Extract student information from the conversation and return ONLY valid JSON (no markdown, no code fences) with these optional fields: studentName, parentName, phone, email, classField, targetExam. Use null for missing fields.

Handle Indian names, Hinglish inputs:
- "mera naam Rahul hai" → studentName: "Rahul"
- "class 11th" → classField: "11th"
- "dropper hu" → classField: "dropper"
- "JEE ki taiyari kar raha hu" → targetExam: "JEE"
- "phone number 9876543210" → phone: "9876543210"`,
              },
              { role: "user", content: text },
            ],
            temperature: 0.1,
            max_tokens: 256,
          }),
        }
      );

      if (!res.ok) return {};

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) return {};

      const sanitized = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*$/g, "")
        .trim();

      const parsed = JSON.parse(sanitized) as LeadInfo;
      return {
        studentName: parsed.studentName || undefined,
        parentName: parsed.parentName || undefined,
        phone: parsed.phone || undefined,
        email: parsed.email || undefined,
        classField: parsed.classField || undefined,
        targetExam: parsed.targetExam || undefined,
      };
    } catch {
      return {};
    }
  }
}
