import type { AIProvider, ChatParams, LeadInfo } from "./types";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

function createGeminiProvider(): AIProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GeminiProvider({
    provider: "gemini",
    apiKey: key,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}

function createGroqProvider(): AIProvider | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new GroqProvider({
    provider: "groq",
    apiKey: key,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
}

class FallbackProvider implements AIProvider {
  name = "fallback";
  private primary: AIProvider;
  private secondary: AIProvider | null;

  constructor(primary: AIProvider, secondary: AIProvider | null) {
    this.primary = primary;
    this.secondary = secondary;
  }

  streamChat(params: ChatParams): ReadableStream<string> {
    const primary = this.primary;
    const secondary = this.secondary;

    if (!secondary) {
      return primary.streamChat(params);
    }

    return new ReadableStream({
      async start(controller) {
        let primaryStream: ReadableStream<string>;
        try {
          primaryStream = primary.streamChat(params);
        } catch {
          // Primary threw synchronously — try secondary immediately
          try {
            const fallbackStream = secondary.streamChat(params);
            await pipeStream(fallbackStream, controller);
          } catch (e) {
            const m = e instanceof Error ? e.message : "All AI providers failed";
            controller.enqueue(m);
          }
          controller.close();
          return;
        }

        const reader = primaryStream.getReader();
        let firstChunk = "";

        try {
          const first = await reader.read();
          if (first.done) {
            controller.close();
            return;
          }
          firstChunk = first.value;
        } catch {
          // Primary stream threw on first read — fall back
          try {
            const fallbackStream = secondary.streamChat(params);
            await pipeStream(fallbackStream, controller);
          } catch (e) {
            const m = e instanceof Error ? e.message : "All AI providers failed";
            controller.enqueue(m);
          }
          controller.close();
          return;
        }

        const isError = /^(\n\n)?Error:/i.test(firstChunk);
        if (isError) {
          // Primary failed — try secondary
          try {
            const fallbackStream = secondary.streamChat(params);
            await pipeStream(fallbackStream, controller);
          } catch (e) {
            const m = e instanceof Error ? e.message : "All AI providers failed";
            controller.enqueue(m);
          }
          controller.close();
          return;
        }

        // Primary succeeded — pipe through including the first chunk
        controller.enqueue(firstChunk);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch {
          // ignore mid-stream errors
        }
        controller.close();
      },
    });
  }

  async extractLeadInfo(text: string): Promise<LeadInfo> {
    try {
      return await this.primary.extractLeadInfo(text);
    } catch {
      if (this.secondary) {
        try {
          return await this.secondary.extractLeadInfo(text);
        } catch {
          return {};
        }
      }
      return {};
    }
  }
}

async function pipeStream(
  stream: ReadableStream<string>,
  controller: ReadableStreamDefaultController<string>
): Promise<void> {
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    controller.enqueue(value);
  }
}

export function getAIProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || "gemini") as "gemini" | "groq";

  let primary: AIProvider | null = null;
  let secondary: AIProvider | null = null;

  if (preferred === "groq") {
    primary = createGroqProvider();
    secondary = createGeminiProvider();
  } else {
    primary = createGeminiProvider();
    secondary = createGroqProvider();
  }

  if (!primary && !secondary) {
    console.warn("No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in your .env file.");
    const fallback = {
      name: "none",
      streamChat(_params: ChatParams): ReadableStream<string> {
        return new ReadableStream({
          start(controller) {
            controller.enqueue("AI service is not configured. Please contact the administrator.");
            controller.close();
          },
        });
      },
      async extractLeadInfo(_text: string): Promise<LeadInfo> {
        return {};
      },
    };
    return fallback;
  }

  if (primary && secondary) {
    return new FallbackProvider(primary, secondary);
  }

  return primary!;
}
