import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/leads/constants";

interface LeadStatusBadgeProps {
  status: string;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = LEAD_STATUSES.find((s) => s.value === status);

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
