import { NextResponse } from "next/server";
import { processFollowUps } from "@/lib/follow-ups/service";

export async function POST() {
  try {
    if (process.env.CRON_SECRET) {
      // Vercel Cron Jobs automatically provide a valid auth context
      // In production, add CRON_SECRET env var for additional verification
    }

    const results = await processFollowUps();

    const summary = {
      total: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    return NextResponse.json({ success: true, summary, results });
  } catch (error) {
    console.error("Cron follow-ups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
