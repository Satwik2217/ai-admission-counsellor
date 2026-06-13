import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square, Languages } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, language?: string) => void;
  onStop: () => void;
  isLoading: boolean;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  language,
  onLanguageChange,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  function handleSubmit() {
    if (!input.trim() || isLoading) return;
    onSend(input.trim(), language);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <button
          type="button"
          onClick={() => onLanguageChange(language === "english" ? "hindi" : "english")}
          className="flex h-9 shrink-0 items-center gap-1 rounded-md border px-2 text-xs text-muted-foreground hover:bg-accent"
          title="Toggle language"
        >
          <Languages className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{language === "english" ? "EN" : "HI"}</span>
        </button>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === "english"
                ? "Type your message..."
                : "अपना संदेश लिखें..."
            }
            rows={1}
            className="flex max-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <Button type="button" size="icon" variant="secondary" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
