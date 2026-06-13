import { cn } from "@/lib/utils";

interface LeadScoringProps {
  score: number;
}

export function LeadScoring({ score }: LeadScoringProps) {
  const getColor = () => {
    if (score >= 60) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 20) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 60 ? "bg-red-500" : score >= 20 ? "bg-orange-500" : "bg-blue-500"
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold", getColor())}>
        {score}
      </span>
    </div>
  );
}
