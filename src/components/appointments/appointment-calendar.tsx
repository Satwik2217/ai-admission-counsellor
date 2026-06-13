"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/appointments/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AppointmentCalendarProps {
  year: number;
  month: number;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  bookedDates?: Set<string>;
}

export function AppointmentCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  bookedDates,
}: AppointmentCalendarProps) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const result: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = [];

    for (let p = 0; p < startPad; p++) {
      const d = new Date(year, month, -p);
      result.unshift({ day: d.getDate(), dateStr: "", isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ day: d, dateStr, isCurrentMonth: true });
    }

    const endPad = 7 - (result.length % 7);
    if (endPad < 7) {
      for (let p = 1; p <= endPad; p++) {
        result.push({ day: p, dateStr: "", isCurrentMonth: false });
      }
    }

    return result;
  }, [year, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-muted-foreground mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, idx) => {
          if (!d.isCurrentMonth) {
            return <div key={idx} className="py-1" />;
          }

          const isToday = d.dateStr === todayStr;
          const isSelected = d.dateStr === selectedDate;
          const hasBookings = bookedDates?.has(d.dateStr);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(d.dateStr)}
              disabled={!d.isCurrentMonth}
              className={cn(
                "relative flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "border border-primary/30 font-semibold",
                !isSelected && !isToday && "text-foreground"
              )}
            >
              {d.day}
              {hasBookings && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
