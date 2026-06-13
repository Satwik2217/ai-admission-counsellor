"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/appointments/constants";

export default function AppointmentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("17:00");
  const [appointmentDuration, setAppointmentDuration] = useState(60);
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/organizations/onboarding");
        if (res.ok) {
          const json = await res.json();
          if (json.workingDays) setWorkingDays(JSON.parse(json.workingDays));
          if (json.openingTime) setOpeningTime(json.openingTime);
          if (json.closingTime) setClosingTime(json.closingTime);
          if (json.appointmentDuration) setAppointmentDuration(json.appointmentDuration);
          if (json.maxBookingsPerSlot !== undefined && json.maxBookingsPerSlot !== null) {
            setMaxBookingsPerSlot(json.maxBookingsPerSlot);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleDay(day: number) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/organizations/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workingDays: JSON.stringify(workingDays),
          openingTime,
          closingTime,
          appointmentDuration,
          maxBookingsPerSlot,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appointment Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure working days, hours, and booking limits for appointments.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Working Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  workingDays.includes(day.value)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input text-muted-foreground hover:border-primary/50"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="opening">Opening Time</Label>
            <Input
              id="opening"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closing">Closing Time</Label>
            <Input
              id="closing"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration">Appointment Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={240}
              step={15}
              value={appointmentDuration}
              onChange={(e) => setAppointmentDuration(parseInt(e.target.value) || 60)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxBookings">Max Bookings Per Slot</Label>
            <Input
              id="maxBookings"
              type="number"
              min={1}
              max={20}
              value={maxBookingsPerSlot}
              onChange={(e) => setMaxBookingsPerSlot(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-1 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600">Saved successfully</span>
        )}
      </div>
    </div>
  );
}
