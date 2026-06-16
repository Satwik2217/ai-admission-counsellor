import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { AIProvider, AIConfig, ChatParams, LeadInfo } from "./types";
import { RateLimitError } from "./types";

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
          if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.includes("quota exceeded") || errMsg.includes("Quota exceeded")) {
            const retryMatch = errMsg.match(/([\d.]+)\s*s(?:econds?)?/i);
            const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;
            controller.enqueue(
              `I'm currently experiencing high demand and can't respond right now. Please try again in a moment or contact the institute directly. 🙏`
            );
            controller.close();
            return;
          }
          controller.enqueue(`\n\nError: ${errMsg}`);
          controller.close();
        }
      },
    });
  }

  async extractLeadInfo(text: string): Promise<LeadInfo> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              studentName: {
                type: SchemaType.STRING,
                description: "Full name of the student if mentioned",
                nullable: true,
              },
              parentName: {
                type: SchemaType.STRING,
                description: "Full name of the parent/guardian if mentioned",
                nullable: true,
              },
              phone: {
                type: SchemaType.STRING,
                description: "Phone/contact number if mentioned (with country code if available)",
                nullable: true,
              },
              email: {
                type: SchemaType.STRING,
                description: "Email address if mentioned",
                nullable: true,
              },
              classField: {
                type: SchemaType.STRING,
                description: "Current class, grade, or standard the student is studying in (e.g., '11th', '12th', '10th', 'dropper', 'repeater')",
                nullable: true,
              },
              targetExam: {
                type: SchemaType.STRING,
                description: "Target exam the student is preparing for (e.g., 'JEE', 'NEET', 'CUET', 'GATE', 'UPSC', 'SSC', 'CAT')",
                nullable: true,
              },
            },
            required: [],
          },
        },
        systemInstruction: `You are a lead information extractor. Your job is to analyze a conversation between a student/parent and an admission counselor, and extract any student information mentioned.

Extract ONLY information that is explicitly mentioned. Do not guess or infer. If a field is not mentioned, leave it null.

Handle Indian names, Hinglish inputs, and various ways people share their details:
- "mera naam Rahul hai" → studentName: "Rahul"
- "class 11th" → classField: "11th"
- "dropper hu" → classField: "dropper"
- "JEE ki taiyari kar raha hu" → targetExam: "JEE"
- "mummy ka naam Priya hai" → parentName: "Priya"
- "phone number 9876543210" → phone: "9876543210"`,
      });

      const result = await model.generateContent(text);
      const response = result.response;
      const jsonText = response.text();

      const parsed = JSON.parse(jsonText) as LeadInfo;
      return {
        studentName: parsed.studentName || undefined,
        parentName: parsed.parentName || undefined,
        phone: parsed.phone || undefined,
        email: parsed.email || undefined,
        classField: parsed.classField || undefined,
        targetExam: parsed.targetExam || undefined,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "";
      if (errMsg.includes("429") || errMsg.includes("Too Many Requests") || errMsg.includes("quota exceeded")) {
        console.warn("Gemini rate limit hit during lead extraction, skipping extraction");
      }
      return {};
    }
  }
}
