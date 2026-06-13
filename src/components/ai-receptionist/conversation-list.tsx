import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Mail } from "lucide-react";

interface ConversationSummary {
  id: string;
  studentName?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  language: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.length === 0 && (
          <div className="flex h-20 items-center justify-center">
            <p className="text-xs text-muted-foreground">No conversations yet.</p>
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
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {conv.studentName || "Anonymous"}
              </span>
              <Badge
                variant={conv.status === "lead_captured" ? "default" : "secondary"}
                className="shrink-0 text-[10px] px-1.5 py-0"
              >
                {conv.status === "lead_captured" ? "Lead" : "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {conv.lastMessage || "No messages"}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{conv.messageCount}</span>
              {(conv.phone || conv.email) && (
                <>
                  {conv.phone && <Phone className="ml-1 h-3 w-3" />}
                  {conv.email && <Mail className="ml-1 h-3 w-3" />}
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
