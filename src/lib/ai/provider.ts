import type { AIProvider, AIConfig } from "./types";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";

export function getAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER || "gemini";

  const config: AIConfig = {
    provider: providerName as "gemini" | "groq",
    apiKey: providerName === "groq" ? process.env.GROQ_API_KEY || "" : process.env.GEMINI_API_KEY || "",
    model: providerName === "groq"
      ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
      : process.env.GEMINI_MODEL || "gemini-2.0-flash",
  };

  if (!config.apiKey) {
    console.warn(
      `${providerName.toUpperCase()}_API_KEY not set. ` +
      `Set ${providerName.toUpperCase()}_API_KEY in your .env file.`
    );
  }

  switch (providerName) {
    case "groq":
      return new GroqProvider(config);
    case "gemini":
    default:
      return new GeminiProvider(config);
  }
}
