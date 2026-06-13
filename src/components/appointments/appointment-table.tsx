"use client";

import { useState, useEffect } from "react";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, Loader2, Phone, Mail } from "lucide-react";

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

interface AppointmentTableProps {
  appointments: AppointmentRow[];
  onStatusChange: (id: string, status: string) => void;
  onReschedule: (appointment: AppointmentRow) => void;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function AppointmentTable({ appointments, onStatusChange, onReschedule }: AppointmentTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No appointments found for this date.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="min-w-full divide-y">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y bg-card">
          {appointments.map((apt) => (
            <tr key={apt.id} className="transition-colors hover:bg-muted/30">
              <td className="px-3 py-2.5 text-sm font-medium">{formatTime(apt.time)}</td>
              <td className="px-3 py-2.5 text-sm">{apt.leadName}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  {apt.leadPhone && <Phone className="h-3 w-3 text-muted-foreground" />}
                  {apt.leadEmail && <Mail className="h-3 w-3 text-muted-foreground" />}
                  {!apt.leadPhone && !apt.leadEmail && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <AppointmentStatusBadge status={apt.status} />
              </td>
              <td className="px-3 py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {apt.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600"
                      onClick={() => onStatusChange(apt.id, "confirmed")}
                      title="Confirm"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {apt.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600"
                      onClick={() => onStatusChange(apt.id, "completed")}
                      title="Mark completed"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {(apt.status === "pending" || apt.status === "confirmed") && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onReschedule(apt)}
                        title="Reschedule"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onStatusChange(apt.id, "cancelled")}
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
