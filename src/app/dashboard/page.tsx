"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  UserCheck,
  Loader2,
  Zap,
  Phone,
  Globe,
  MessageCircle,
  Share2,
  Footprints,
  HelpCircle,
} from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByCategory: { category: string; count: number }[];
  activeConversations: number;
  leadsCaptured: number;
  conversionRate: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  totalAppointments: number;
  teamMembers: number;
  recentConversations: { id: string; studentName: string | null; phone: string | null; status: string; channel: string; createdAt: string }[];
  recentLeads: { id: string; name: string; score: number; category: string; source: string; createdAt: string }[];
  organizationName: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", interested: "Interested", converted: "Converted", lost: "Lost",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500", contacted: "bg-yellow-500", interested: "bg-purple-500", converted: "bg-green-500", lost: "bg-red-500",
};

const SOURCE_ICONS: Record<string, typeof Globe> = {
  website: Globe, chat: MessageCircle, whatsapp: Phone, referral: Share2, walk_in: Footprints, social_media: Share2, phone_inquiry: Phone, campaign: Zap, direct: Users, other: HelpCircle,
};

function getSourceIcon(source: string) {
  const Icon = SOURCE_ICONS[source] || HelpCircle;
  return <Icon className="h-3.5 w-3.5" />;
}

const CATEGORY_COLORS: Record<string, string> = {
  vip: "text-purple-600 bg-purple-50", hot: "text-red-600 bg-red-50", warm: "text-orange-600 bg-orange-50", cold: "text-blue-600 bg-blue-50",
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.ok && res.json())
      .then((json) => { if (json) setData(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const catCount = (cat: string) => data.leadsByCategory.find((c) => c.category === cat)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.organizationName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Owner Dashboard — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads}</div>
            <div className="mt-1 flex gap-1">
              {data.leadsByCategory.map((c) => (
                <span key={c.category} className={`text-[10px] px-1 rounded ${CATEGORY_COLORS[c.category] || "text-gray-600 bg-gray-50"}`}>
                  {c.category} {c.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Intent</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{catCount("vip") + catCount("hot")}</div>
            <p className="text-xs text-muted-foreground">{catCount("vip")} VIP, {catCount("hot")} Hot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeConversations}</div>
            <p className="text-xs text-muted-foreground">{data.leadsCaptured} leads captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">{data.pendingAppointments} pending, {data.confirmedAppointments} confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Chat to lead rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teamMembers}</div>
            <p className="text-xs text-muted-foreground">Active counselors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["new", "contacted", "interested", "converted", "lost"].map((status) => {
                const item = data.leadsByStatus.find((s) => s.status === status);
                const count = item?.count ?? 0;
                const pct = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{STATUS_LABELS[status] || status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${STATUS_COLORS[status] || "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.leadsBySource.map((item) => {
                const pct = data.totalLeads > 0 ? (item.count / data.totalLeads) * 100 : 0;
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        {getSourceIcon(item.source)}
                        {item.source}
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentConversations.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : (
              <div className="space-y-2">
                {data.recentConversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{(conv.studentName?.[0] || "?").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{conv.studentName || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={conv.status === "lead_captured" ? "default" : "secondary"} className="text-[10px] px-1.5 h-4">
                        {conv.status === "lead_captured" ? "Lead" : conv.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatRelative(conv.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No leads yet.</div>
            ) : (
              <div className="space-y-2">
                {data.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{(lead.name[0] || "?").toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{lead.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 h-4 ${CATEGORY_COLORS[lead.category] || ""}`}>
                        {lead.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold">{lead.score}</span>
                      <span className="text-xs text-muted-foreground">{formatRelative(lead.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
