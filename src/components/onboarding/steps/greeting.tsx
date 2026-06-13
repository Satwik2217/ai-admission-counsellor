import { Label } from "@/components/ui/label";

interface GreetingStepProps {
  data: {
    greetingMessage: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function GreetingStep({ data, errors, onChange }: GreetingStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Greeting Message</h2>
        <p className="text-sm text-muted-foreground">
          Set the welcome message students will see when they first interact with the AI counselor.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Preview</p>
        <div className="mt-2 rounded-lg bg-primary/5 p-3 italic text-sm text-muted-foreground">
          {data.greetingMessage || (
            <span className="text-muted-foreground/50">
              Your greeting message will appear here...
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting">Greeting Message</Label>
        <textarea
          id="greeting"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder='e.g., "Welcome to XYZ Academy. How may I help you?"'
          value={data.greetingMessage}
          onChange={(e) => onChange("greetingMessage", e.target.value)}
        />
        {errors.greetingMessage && <p className="text-xs text-destructive">{errors.greetingMessage}</p>}
        <p className="text-xs text-muted-foreground">
          This message will be shown to students when they start a conversation.
        </p>
      </div>
    </div>
  );
}
