"use client";

import { LeadStatusBadge } from "./lead-status-badge";
import { LeadCategoryBadge } from "./lead-category-badge";
import { LeadScoring } from "./lead-scoring";
import { ChevronDown, ChevronUp, Phone, Mail } from "lucide-react";

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  interestedCourse: string | null;
  source: string;
  status: string;
  score: number;
  category: string;
  createdAt: string;
  updatedAt: string;
  _count: { notes: number; activities: number };
}

interface LeadTableProps {
  leads: LeadRow[];
  sort: string;
  order: string;
  onSort: (field: string) => void;
  onSelect: (id: string) => void;
}

const sourceLabels: Record<string, string> = {
  direct: "Direct",
  website: "Website",
  referral: "Referral",
  social_media: "Social Media",
  phone_inquiry: "Phone",
  chat: "Chat",
  walk_in: "Walk-in",
  other: "Other",
};

export function LeadTable({ leads, sort, order, onSort, onSelect }: LeadTableProps) {
  function SortHeader({ field, children }: { field: string; children: React.ReactNode }) {
    const isActive = sort === field;
    return (
      <th
        className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
        onClick={() => onSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive && (
            order === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </th>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border">
        <p className="text-sm text-muted-foreground">No leads found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="min-w-full divide-y">
        <thead className="bg-muted/50">
          <tr>
            <SortHeader field="name">Name</SortHeader>
            <SortHeader field="status">Status</SortHeader>
            <SortHeader field="category">Category</SortHeader>
            <SortHeader field="score">Score</SortHeader>
            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contact
            </th>
            <SortHeader field="interestedCourse">Course</SortHeader>
            <SortHeader field="source">Source</SortHeader>
            <SortHeader field="createdAt">Created</SortHeader>
          </tr>
        </thead>
        <tbody className="divide-y bg-card">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(lead.id)}
            >
              <td className="px-3 py-3">
                <span className="text-sm font-medium">{lead.name}</span>
              </td>
              <td className="px-3 py-3">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-3 py-3">
                <LeadCategoryBadge category={lead.category} />
              </td>
              <td className="px-3 py-3">
                <LeadScoring score={lead.score} />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1.5">
                  {lead.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                  {lead.email && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                  {!lead.phone && !lead.email && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-sm text-muted-foreground">
                  {lead.interestedCourse || "—"}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-sm text-muted-foreground">
                  {sourceLabels[lead.source] || lead.source}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
