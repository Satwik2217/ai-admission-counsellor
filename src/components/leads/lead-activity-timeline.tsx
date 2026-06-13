import { cn } from "@/lib/utils";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/constants";

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface LeadActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<string, string> = {
  [LEAD_ACTIVITY_TYPES.LEAD_CREATED]: "●",
  [LEAD_ACTIVITY_TYPES.LEAD_UPDATED]: "○",
  [LEAD_ACTIVITY_TYPES.STATUS_CHANGED]: "◆",
  [LEAD_ACTIVITY_TYPES.NOTE_ADDED]: "📝",
  [LEAD_ACTIVITY_TYPES.PHONE_PROVIDED]: "📞",
  [LEAD_ACTIVITY_TYPES.EMAIL_PROVIDED]: "✉",
  [LEAD_ACTIVITY_TYPES.ASKED_ABOUT_FEES]: "💰",
  [LEAD_ACTIVITY_TYPES.ASKED_ABOUT_ADMISSIONS]: "🎓",
  [LEAD_ACTIVITY_TYPES.BOOKED_APPOINTMENT]: "📅",
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function LeadActivityTimeline({ activities }: LeadActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => (
        <div key={activity.id} className="relative flex gap-3 pb-4">
          {idx < activities.length - 1 && (
            <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
          )}
          <div
            className={cn(
              "flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full text-[8px]",
              activity.type === LEAD_ACTIVITY_TYPES.LEAD_CREATED
                ? "bg-green-100 text-green-700"
                : activity.type === LEAD_ACTIVITY_TYPES.STATUS_CHANGED
                  ? "bg-blue-100 text-blue-700"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {activityIcons[activity.type] || "·"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm">{activity.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
