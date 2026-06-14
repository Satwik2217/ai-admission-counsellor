"use client";

import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/lib/leads/constants";

interface LeadFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
}

export function LeadFilters({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: LeadFiltersProps) {
  const hasFilters = statusFilter || sourceFilter || categoryFilter;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search leads by name, phone, email..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            <option value="vip">VIP</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onStatusFilterChange("");
              onSourceFilterChange("");
              onCategoryFilterChange("");
            }}
            className="h-9"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
