"use client";

import { cn } from "@/lib/utils";
import { Clock, X } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  maxBookings: number;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}

export function SlotPicker({ slots, selectedTime, onSelect, loading }: SlotPickerProps) {
  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Clock className="mx-auto h-5 w-5 text-muted-foreground/50" />
          <p className="mt-1 text-xs text-muted-foreground">
            No slots available for this date
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isFull = !slot.available;
        const isSelected = selectedTime === slot.time;

        return (
          <button
            key={slot.time}
            onClick={() => !isFull && onSelect(slot.time)}
            disabled={isFull}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : isFull
                  ? "border-dashed border-muted-foreground/30 text-muted-foreground/50 cursor-not-allowed line-through"
                  : "border-border hover:border-primary/50 hover:bg-accent cursor-pointer"
            )}
          >
            {isFull ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {formatTime(slot.time)}
          </button>
        );
      })}
    </div>
  );
}
