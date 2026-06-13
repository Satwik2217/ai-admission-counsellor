"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Calendar } from "lucide-react";
import { MONTH_NAMES } from "@/lib/appointments/constants";

interface RescheduleDialogProps {
  appointment: {
    id: string;
    leadName: string;
    date: string;
    time: string;
  };
  onClose: () => void;
  onRescheduled: () => void;
}

export function RescheduleDialog({ appointment, onClose, onRescheduled }: RescheduleDialogProps) {
  const [date, setDate] = useState(() => {
    const d = new Date(appointment.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [time, setTime] = useState(appointment.time);
  const [slots, setSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSlots() {
      if (!date) return;
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/appointments/slots?date=${date}`);
        if (res.ok) {
          const json = await res.json();
          const filtered = json.slots?.filter((s: { available: boolean }) => s.available) || [];
          setSlots(filtered);
          if (!filtered.find((s: { time: string }) => s.time === time)) {
            setTime("");
          }
        }
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [date, time]);

  function formatTime(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });
      if (res.ok) {
        onRescheduled();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reschedule</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Rescheduling appointment for <strong>{appointment.leadName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New Time</label>
            {loadingSlots ? (
              <div className="flex h-9 items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots for this date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTime(slot.time)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      time === slot.time
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!date || !time || submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
