import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUSES } from "@/lib/appointments/constants";

interface AppointmentStatusBadgeProps {
  status: string;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const config = APPOINTMENT_STATUSES.find((s) => s.value === status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config?.color || "bg-gray-100 text-gray-800"
      )}
    >
      {config?.label || status}
    </span>
  );
}
