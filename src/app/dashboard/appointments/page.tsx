"use client";

import { useState, useEffect, useCallback } from "react";
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { SlotPicker } from "@/components/appointments/slot-picker";
import { BookingDialog } from "@/components/appointments/booking-dialog";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface AppointmentRow {
  id: string;
  leadName: string;
  leadPhone: string | null;
  leadEmail: string | null;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  lead?: { id: string; name: string } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  maxBookings: number;
}

function getTodayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [showBooking, setShowBooking] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentRow | null>(null);

  const fetchAppointments = useCallback(async (date: string) => {
    setAppointmentsLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setAppointments(json.appointments);
      }
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSelectedTime(null);
    try {
      const res = await fetch(`/api/appointments/slots?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setSlots(json.slots || []);
      }
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate);
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchAppointments, fetchSlots]);

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAppointments(selectedDate);
        fetchSlots(selectedDate);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Schedule and manage student appointments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <AppointmentCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedTime(null);
            }}
            onPrevMonth={() => {
              if (month === 0) { setYear(year - 1); setMonth(11); }
              else { setMonth(month - 1); }
            }}
            onNextMonth={() => {
              if (month === 11) { setYear(year + 1); setMonth(0); }
              else { setMonth(month + 1); }
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })
                    : "Select a date"}
                </h3>
                <p className="text-xs text-muted-foreground">Available time slots</p>
              </div>
              {selectedTime && (
                <Button size="sm" onClick={() => setShowBooking(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Book Slot
                </Button>
              )}
            </div>
            <SlotPicker
              slots={slots}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
              loading={slotsLoading}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Appointments for{" "}
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })
                  : "selected date"}
              </h3>
              <span className="text-xs text-muted-foreground">
                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
              </span>
            </div>
            {appointmentsLoading ? (
              <div className="flex h-32 items-center justify-center rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AppointmentTable
                appointments={appointments}
                onStatusChange={handleStatusChange}
                onReschedule={setRescheduleTarget}
              />
            )}
          </div>
        </div>
      </div>

      {showBooking && selectedDate && selectedTime && (
        <BookingDialog
          date={selectedDate}
          time={selectedTime}
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            fetchAppointments(selectedDate);
            fetchSlots(selectedDate);
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleDialog
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            fetchAppointments(selectedDate);
            fetchSlots(selectedDate);
          }}
        />
      )}
    </div>
  );
}
