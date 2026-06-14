"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InboxConversationList } from "./conversation-list";
import { ReplySection } from "./reply-section";
import { cn } from "@/lib/utils";
import {
  Bot,
  Globe,
  MessageSquare,
  Plus,
  Loader2,
  User,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
}

interface ConversationSummary {
  id: string;
  studentName: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
  status: string;
  mode: string;
  language: string;
  assignedTo: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  channel: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  studentName: string | null;
  parentName: string | null;
  phone: string | null;
  email: string | null;
  classField: string | null;
  targetExam: string | null;
  channel: string;
  status: string;
  mode: string;
  language: string;
  assignedTo: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface InboxViewProps {
  _organizationId: string;
  currentUserId: string;
  teamMembers: TeamMember[];
}

type ChannelFilter = "ALL" | "WEBSITE" | "WHATSAPP";
type StatusFilter = "ALL" | "active" | "lead_captured" | "closed";

const channelIcons: Record<string, React.ReactNode> = {
  WEBSITE: <Globe className="h-3.5 w-3.5" />,
  WHATSAPP: <Smartphone className="h-3.5 w-3.5" />,
};

const channelLabels: Record<string, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function InboxView({ currentUserId, teamMembers }: InboxViewProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (channelFilter !== "ALL") params.set("channel", channelFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    fetch(`/api/conversations?${params.toString()}`)
      .then((res) => res.ok && res.json())
      .then((json) => {
        if (json) setConversations(json.conversations);
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [channelFilter, statusFilter]);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/conversations/${selectedId}`)
        .then((res) => res.ok && res.json())
        .then((json) => {
          if (json) setDetail(json.conversation);
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setShowMobileList(false);
  };

  const handleNew = () => {
    setSelectedId(null);
    setDetail(null);
    setShowMobileList(true);
  };

  const handleBack = () => {
    setSelectedId(null);
    setDetail(null);
    setShowMobileList(true);
  };

  const handleUpdateConversation = async (data: { mode?: string; assignedToId?: string | null; status?: string }) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setDetail((prev) => (prev ? { ...prev, ...json.conversation } : null));
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async (content: string) => {
    if (!selectedId || !detail) return;
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: crypto.randomUUID(),
                role: "user" as const,
                content: content.trim(),
                channel: detail.channel,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : null
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, lastMessage: content.trim(), messageCount: c.messageCount + 1 } : c
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div
        className={cn(
          "w-full shrink-0 md:w-80 md:block",
          !showMobileList && "hidden md:block"
        )}
      >
        <div className="flex h-full flex-col rounded-lg border">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-semibold">Inbox</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1 border-b p-2">
            {(["ALL", "WEBSITE", "WHATSAPP"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => { setChannelFilter(ch); setSelectedId(null); }}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  channelFilter === ch
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {ch !== "ALL" && channelIcons[ch]}
                {ch === "ALL" ? "All" : channelLabels[ch]}
              </button>
            ))}
          </div>

          <div className="flex gap-1 border-b px-2 py-1.5">
            {(["ALL", "active", "lead_captured", "closed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setSelectedId(null); }}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  statusFilter === st
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {st === "ALL" ? "All" : st === "lead_captured" ? "Lead" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            <InboxConversationList
              conversations={conversations}
              activeId={selectedId}
              onSelect={handleSelect}
              loading={loadingList}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-lg border",
          showMobileList && "hidden md:flex"
        )}
      >
        {!selectedId || !detail ? (
          <div className="flex h-full items-center justify-center">
            {loadingDetail ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Unified Inbox</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a conversation to view and reply
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {channelIcons[detail.channel] || <Globe className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {detail.studentName || detail.phone || "Anonymous"}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {channelLabels[detail.channel] || detail.channel}
                  </Badge>
                  <Badge
                    variant={detail.mode === "auto" ? "secondary" : "default"}
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {detail.mode === "auto" ? "Auto" : "Manual"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {detail.phone && <span className="mr-2">{detail.phone}</span>}
                  {detail.email && <span>{detail.email}</span>}
                </p>
              </div>

              <Select
                value={detail.assignedTo?.id || "unassigned"}
                onValueChange={(val) => {
                  if (val === "unassigned") handleUpdateConversation({ assignedToId: null });
                  else if (val === "me") handleUpdateConversation({ assignedToId: currentUserId });
                  else handleUpdateConversation({ assignedToId: val });
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                  <SelectItem value="me" className="text-xs">Assign to me</SelectItem>
                  {teamMembers
                    .filter((m) => m.id !== currentUserId)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.firstName || m.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                variant={detail.mode === "auto" ? "outline" : "default"}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() =>
                  handleUpdateConversation({
                    mode: detail.mode === "auto" ? "manual" : "auto",
                  })
                }
              >
                <Bot className="h-3 w-3" />
                {detail.mode === "auto" ? "AI Auto" : "Manual"}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {detail.messages.length === 0 && (
                  <div className="flex h-full min-h-[200px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  </div>
                )}
                {detail.messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          msg.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>{formatTime(msg.createdAt)}</span>
                        {msg.channel !== "WEBSITE" && (
                          <>
                            <span>·</span>
                            <span>{channelLabels[msg.channel] || msg.channel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <ReplySection
              mode={detail.mode}
              onSend={handleSend}
              language={detail.language}
            />
          </>
        )}
      </div>
    </div>
  );
}
