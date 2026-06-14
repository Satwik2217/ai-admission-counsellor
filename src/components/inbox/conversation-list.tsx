import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare, Bot } from "lucide-react";

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

interface InboxConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export function InboxConversationList({
  conversations,
  activeId,
  onSelect,
  loading,
}: InboxConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0.5 p-2">
        {conversations.length === 0 && (
          <div className="flex h-20 items-center justify-center">
            <p className="text-xs text-muted-foreground">No conversations found.</p>
          </div>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full rounded-lg p-3 text-left text-sm transition-colors hover:bg-accent",
              activeId === conv.id && "bg-accent"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                {conv.channel === "WHATSAPP" ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                    <path d="M7 8h10M7 12h8M7 16h5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium truncate">
                    {conv.studentName || conv.phone || "Anonymous"}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatTime(conv.updatedAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {conv.lastMessage || "No messages"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant={conv.status === "lead_captured" ? "default" : "secondary"}
                    className="text-[10px] px-1 py-0 h-4"
                  >
                    {conv.status === "lead_captured" ? "Lead" : conv.status === "closed" ? "Closed" : "Active"}
                  </Badge>
                  {conv.mode === "manual" && (
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  )}
                  {conv.assignedTo && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {conv.assignedTo.firstName || "Assigned"}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                    <MessageSquare className="h-3 w-3" />
                    {conv.messageCount}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
