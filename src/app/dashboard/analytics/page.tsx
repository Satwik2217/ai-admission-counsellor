"use client";

import { useState, useEffect } from "react";
import { StatsCard } from "@/components/analytics/stats-card";
import { BarChart } from "@/components/analytics/bar-chart";
import { MessageSquare, Users, CalendarDays, TrendingUp, Target, Timer } from "lucide-react";

interface AnalyticsData {
  totalChats: number;
  leadsCaptured: number;
  totalLeads: number;
  totalAppointments: number;
  conversionRate: number;
  hotLeads: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  popularQuestions: Array<{ question: string; count: number }>;
  recentConversations: Array<{ id: string; studentName: string | null; status: string; createdAt: string }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Failed to load analytics.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Chats"
          value={data.totalChats}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatsCard
          label="Leads Captured"
          value={data.leadsCaptured}
          icon={<Users className="h-5 w-5" />}
          sublabel={`${data.totalLeads} total in CRM`}
        />
        <StatsCard
          label="Appointments"
          value={data.totalAppointments}
          icon={<CalendarDays className="h-5 w-5" />}
          sublabel={`${data.pendingAppointments} pending, ${data.confirmedAppointments} confirmed`}
        />
        <StatsCard
          label="Conversion Rate"
          value={`${data.conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          sublabel="Chat to lead conversion"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Popular Questions</h3>
          </div>
          <BarChart
            data={data.popularQuestions.map((q) => ({ label: q.question, value: q.count }))}
          />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Recent Conversations</h3>
          </div>
          <div className="space-y-2">
            {data.recentConversations.length === 0 && (
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
            )}
            {data.recentConversations.map((conv) => (
              <div key={conv.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <span className="font-medium">{conv.studentName || "Anonymous"}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${
                    conv.status === "lead_captured" ? "text-emerald-600" : "text-muted-foreground"
                  }`}>
                    {conv.status === "lead_captured" ? "Lead" : "Active"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
