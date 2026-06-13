import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, AIConfig, ChatParams, ChatMessage } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: AIConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  streamChat(params: ChatParams): ReadableStream<string> {
    const { messages, systemPrompt, context } = params;

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const fullContext = context
      ? `${systemPrompt}\n\nRELEVANT INFORMATION:\n${context}`
      : systemPrompt;

    const client = this.client;
    const modelName = this.model;

    return new ReadableStream({
      async start(controller) {
        try {
          const model = client.getGenerativeModel({
            model: modelName,
            systemInstruction: fullContext,
          });

          const chat = model.startChat({ history });

          const result = await chat.sendMessageStream(lastMessage.content);

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(text);
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
}
