interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  maxBars?: number;
}

export function BarChart({ data, maxBars = 10 }: BarChartProps) {
  const items = data.slice(0, maxBars);
  const maxValue = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 truncate text-xs text-muted-foreground text-right shrink-0" title={item.label}>
            {item.label.length > 20 ? item.label.slice(0, 20) + "..." : item.label}
          </span>
          <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded bg-primary transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="w-8 text-xs font-medium text-right shrink-0">{item.value}</span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
    </div>
  );
}
