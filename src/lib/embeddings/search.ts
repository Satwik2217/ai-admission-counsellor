import { prisma } from "@/lib/prisma";
import { cosineSimilarity, getEmbeddingProvider } from "./provider";
import {
  FALLBACK_RESPONSE,
  SIMILARITY_THRESHOLD,
  type SearchResult,
} from "@/lib/knowledge-base";

interface ContextEntry {
  content: string;
  title?: string;
  category: string;
  score: number;
}

export interface RetrievalResult {
  answer: string;
  context: ContextEntry[];
  found: boolean;
}

export async function searchSimilar(
  organizationId: string,
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const provider = getEmbeddingProvider();
  const queryVector = await provider.generateEmbedding(query);

  if (queryVector.length === 0) return [];

  const embeddings = await prisma.embedding.findMany({
    where: { organizationId },
  });

  if (embeddings.length === 0) return [];

  const scored = embeddings
    .map((e) => ({
      id: e.id,
      sourceType: e.sourceType as "FAQ" | "KB",
      sourceId: e.sourceId,
      content: e.content,
      category: "",
      score: cosineSimilarity(queryVector, JSON.parse(e.vector)),
    }))
    .filter((r) => r.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const results: SearchResult[] = [];

  for (const item of scored) {
    if (item.sourceType === "FAQ") {
      const faq = await prisma.fAQ.findUnique({
        where: { id: item.sourceId },
        select: { category: true, question: true },
      });
      results.push({
        ...item,
        title: faq?.question || undefined,
        category: faq?.category || "",
      });
    } else {
      const kb = await prisma.knowledgeBase.findUnique({
        where: { id: item.sourceId },
        select: { category: true, title: true },
      });
      results.push({
        ...item,
        title: kb?.title || undefined,
        category: kb?.category || "",
      });
    }
  }

  return results;
}

export async function retrieveContext(
  organizationId: string,
  query: string
): Promise<RetrievalResult> {
  const results = await searchSimilar(organizationId, query);

  if (results.length === 0) {
    return {
      answer: FALLBACK_RESPONSE,
      context: [],
      found: false,
    };
  }

  const context = results.map((r) => ({
    content: r.content,
    title: r.title,
    category: r.category,
    score: r.score,
  }));

  const combinedContext = context
    .map((c) => (c.title ? `[${c.title}] ${c.content}` : c.content))
    .join("\n\n");

  return {
    answer: combinedContext,
    context,
    found: true,
  };
}
