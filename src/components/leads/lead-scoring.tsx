import { cn } from "@/lib/utils";

interface LeadScoringProps {
  score: number;
}

const TIERS = [
  { min: 80, barColor: "bg-purple-500", textColor: "text-purple-600 bg-purple-50 border-purple-200" },
  { min: 50, barColor: "bg-red-500", textColor: "text-red-600 bg-red-50 border-red-200" },
  { min: 20, barColor: "bg-orange-500", textColor: "text-orange-600 bg-orange-50 border-orange-200" },
  { min: 0, barColor: "bg-blue-500", textColor: "text-blue-600 bg-blue-50 border-blue-200" },
];

export function LeadScoring({ score }: LeadScoringProps) {
  const tier = TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all", tier.barColor)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold", tier.textColor)}>
        {score}
      </span>
    </div>
  );
}
