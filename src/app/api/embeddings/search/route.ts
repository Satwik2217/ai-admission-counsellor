import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { retrieveContext } from "@/lib/embeddings/search";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { query } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

    const result = await retrieveContext(membership.organizationId, query.trim());

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
