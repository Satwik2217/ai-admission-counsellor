import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkingHoursStepProps {
  data: {
    openingTime: string;
    closingTime: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function WorkingHoursStep({ data, errors, onChange }: WorkingHoursStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Working Hours</h2>
        <p className="text-sm text-muted-foreground">Set your institute's operating hours.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="opening-time">Opening Time</Label>
          <Input
            id="opening-time"
            type="time"
            value={data.openingTime}
            onChange={(e) => onChange("openingTime", e.target.value)}
          />
          {errors.openingTime && <p className="text-xs text-destructive">{errors.openingTime}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing-time">Closing Time</Label>
          <Input
            id="closing-time"
            type="time"
            value={data.closingTime}
            onChange={(e) => onChange("closingTime", e.target.value)}
          />
          {errors.closingTime && <p className="text-xs text-destructive">{errors.closingTime}</p>}
        </div>
      </div>
    </div>
  );
}
