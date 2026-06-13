export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || "openai";

  switch (provider) {
    case "openai":
      return createOpenAIProvider();
    default:
      return createOpenAIProvider();
  }
}

function createOpenAIProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  if (!apiKey) {
    console.warn(
      "OPENAI_API_KEY not set. Embeddings will not work. " +
      "Set OPENAI_API_KEY in your .env file."
    );
  }

  async function generateEmbedding(text: string): Promise<number[]> {
    if (!apiKey) return [];

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embedding error: ${err}`);
    }

    const json = await res.json();
    return json.data[0].embedding;
  }

  async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!apiKey || texts.length === 0) return [];

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embedding error: ${err}`);
    }

    const json = await res.json();
    return json.data.map((d: { embedding: number[] }) => d.embedding);
  }

  return { generateEmbedding, generateEmbeddings };
}
