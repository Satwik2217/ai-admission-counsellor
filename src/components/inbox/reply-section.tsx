"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot } from "lucide-react";

interface ReplySectionProps {
  mode: string;
  onSend: (message: string) => void;
  language: string;
}

export function ReplySection({ mode, onSend, language }: ReplySectionProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  function handleSubmit() {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (mode === "auto") {
    return (
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-center justify-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            AI is replying automatically. Switch to Manual to respond personally.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === "hindi" ? "अपना संदेश लिखें..." : "Type your message..."}
            rows={1}
            className="flex max-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="button" size="icon" onClick={handleSubmit} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
