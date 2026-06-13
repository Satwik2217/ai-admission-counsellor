import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getEmbeddingProvider } from "@/lib/embeddings/provider";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sourceType, sourceId, content } = await req.json();

    if (!sourceType || !sourceId || !content?.trim()) {
      return NextResponse.json(
        { error: "sourceType, sourceId, and content are required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const provider = getEmbeddingProvider();
    const vector = await provider.generateEmbedding(content);

    if (vector.length === 0) {
      return NextResponse.json(
        { error: "Embedding generation failed. Check your API key." },
        { status: 500 }
      );
    }

    await prisma.embedding.upsert({
      where: {
        sourceType_sourceId: {
          sourceType,
          sourceId,
        },
      },
      update: {
        content: content.trim(),
        vector: JSON.stringify(vector),
        organizationId: membership.organizationId,
      },
      create: {
        organizationId: membership.organizationId,
        sourceType,
        sourceId,
        content: content.trim(),
        vector: JSON.stringify(vector),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sourceType, sourceId } = await req.json();

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "sourceType and sourceId are required" },
        { status: 400 }
      );
    }

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    await prisma.embedding.deleteMany({
      where: {
        organizationId: membership.organizationId,
        sourceType,
        sourceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete embedding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
