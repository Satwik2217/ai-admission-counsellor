import { cn } from "@/lib/utils";

interface LeadCategoryBadgeProps {
  category: string;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  vip: { label: "VIP", color: "bg-purple-100 text-purple-800 border-purple-200" },
  hot: { label: "Hot", color: "bg-red-100 text-red-800 border-red-200" },
  warm: { label: "Warm", color: "bg-orange-100 text-orange-800 border-orange-200" },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800 border-blue-200" },
};

export function LeadCategoryBadge({ category }: LeadCategoryBadgeProps) {
  const config = categoryConfig[category] || { label: category, color: "bg-gray-100 text-gray-800" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
