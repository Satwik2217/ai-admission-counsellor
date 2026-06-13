"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { LeadPanel } from "./lead-panel";
import { ConversationList } from "./conversation-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Plus, Loader2 } from "lucide-react";

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

export function ChatInterface() {
  const { messages, isLoading, conversationId, append, stop, loadConversation, reset } = useChat();
  const [language, setLanguage] = useState("english");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [leadInfo, setLeadInfo] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const json = await res.json();
          setConversations(json.conversations);
        }
      } catch {
        // ignore
      } finally {
        setLoadingConversations(false);
      }
    }
    loadConversations();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSelectConversation(id: string) {
    await loadConversation(id);
  }

  async function handleNewConversation() {
    reset();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="hidden w-64 shrink-0 md:block">
        <div className="flex h-full flex-col rounded-lg border">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-medium">Conversations</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              activeId={conversationId}
              onSelect={handleSelectConversation}
              loading={loadingConversations}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">AI Receptionist</span>
          {isLoading && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Typing...
            </span>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">AI Receptionist</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start a conversation. I can help with admissions, courses, fees, and more.
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessage key={msg.id || idx} role={msg.role} content={msg.content} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput
          onSend={append}
          onStop={stop}
          isLoading={isLoading}
          language={language}
          onLanguageChange={setLanguage}
        />
      </div>

      <div className="hidden w-64 shrink-0 lg:block">
        <LeadPanel lead={leadInfo} loading={false} />
      </div>
    </div>
  );
}
