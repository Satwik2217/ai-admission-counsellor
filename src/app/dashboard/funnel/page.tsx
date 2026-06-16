"use client";

import { useState, useEffect } from "react";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { LeadCategoryBadge } from "@/components/leads/lead-category-badge";
import { LeadScoring } from "@/components/leads/lead-scoring";
import { LEAD_STATUSES } from "@/lib/leads/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowRight } from "lucide-react";

interface LeadSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  interestedCourse: string | null;
  source: string;
  status: string;
  score: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const funnelStages = LEAD_STATUSES.filter((s) => s.value !== "lost");
const allStages = LEAD_STATUSES;

const stageLabels: Record<string, string> = {};
for (const s of LEAD_STATUSES) {
  stageLabels[s.value] = s.label;
}

export default function FunnelPage() {
  const [leads, setLeads] = useState<Record<string, LeadSummary[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/leads?limit=500")
      .then((res) => res.ok && res.json())
      .then((json) => {
        if (!json) return;
        const grouped: Record<string, LeadSummary[]> = {};
        const counts: Record<string, number> = {};
        for (const s of allStages) {
          grouped[s.value] = [];
          counts[s.value] = 0;
        }
        for (const lead of json.leads) {
          const status = lead.status || "new";
          if (!grouped[status]) grouped[status] = [];
          grouped[status].push(lead);
          counts[status] = (counts[status] || 0) + 1;
        }
        setLeads(grouped);
        setStatusCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = (e: React.DragEvent, leadId: string, fromStatus: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ leadId, fromStatus }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.fromStatus === toStatus) return;
      const res = await fetch(`/api/leads/${data.leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (res.ok) {
        setLeads((prev) => {
          const leadToMove = prev[data.fromStatus]?.find((l) => l.id === data.leadId);
          if (!leadToMove) return prev;
          return {
            ...prev,
            [data.fromStatus]: (prev[data.fromStatus] || []).filter((l) => l.id !== data.leadId),
            [toStatus]: [...(prev[toStatus] || []), { ...leadToMove, status: toStatus }],
          };
        });
        setStatusCounts((prev) => ({
          ...prev,
          [data.fromStatus]: Math.max(0, (prev[data.fromStatus] || 1) - 1),
          [toStatus]: (prev[toStatus] || 0) + 1,
        }));
      }
    } catch {
      // ignore
    }
  };

  const handleCardClick = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const refreshLeads = () => {
    fetch("/api/leads?limit=500")
      .then((res) => res.ok && res.json())
      .then((json) => {
        if (!json) return;
        const grouped: Record<string, LeadSummary[]> = {};
        const counts: Record<string, number> = {};
        for (const s of allStages) {
          grouped[s.value] = [];
          counts[s.value] = 0;
        }
        for (const lead of json.leads) {
          const status = lead.status || "new";
          if (!grouped[status]) grouped[status] = [];
          grouped[status].push(lead);
          counts[status] = (counts[status] || 0) + 1;
        }
        setLeads(grouped);
        setStatusCounts(counts);
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admission Funnel</h1>
          <p className="text-sm text-muted-foreground">
            Drag leads between stages to update their status
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {funnelStages.map((s, i) => (
            <span key={s.value} className="flex items-center gap-1">
              <span>{statusCounts[s.value] || 0}</span>
              <span>{s.label}</span>
              {i < funnelStages.length - 1 && <ArrowRight className="h-3 w-3" />}
            </span>
          ))}
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4" style={{ minWidth: "900px" }}>
          {allStages.map((stage) => {
            const columnLeads = leads[stage.value] || [];
            return (
              <div
                key={stage.value}
                className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
                onDragOver={(e) => handleDragOver(e, stage.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.value)}
              >
                <div
                  className={`flex items-center justify-between border-b px-3 py-2.5 ${
                    dragOver === stage.value ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${stage.color.replace("text-", "bg-").split(" ")[0]}`} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 p-2 min-h-[200px]">
                  {columnLeads.length === 0 && (
                    <div className="flex h-20 items-center justify-center">
                      <p className="text-xs text-muted-foreground">Drop leads here</p>
                    </div>
                  )}
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id, stage.value)}
                      onClick={() => handleCardClick(lead.id)}
                      className="cursor-grab rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium truncate">{lead.name}</span>
                        <LeadScoring score={lead.score} />
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <LeadCategoryBadge category={lead.category} />
                        {lead.interestedCourse && (
                          <span className="truncate text-xs text-muted-foreground">
                            {lead.interestedCourse}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        {lead.phone && <span className="mr-2">{lead.phone}</span>}
                        {lead.source && <span>{stageLabels[lead.source] || lead.source}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <LeadDetailSheet
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={refreshLeads}
      />
    </div>
  );
}
