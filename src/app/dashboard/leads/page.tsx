"use client";

import { useState, useEffect, useCallback } from "react";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface LeadSummary {
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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, sourceFilter, categoryFilter, sort, order]);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  function handleSort(field: string) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
  }

  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [coldCount, setColdCount] = useState(0);

  useEffect(() => {
    setHotCount(leads.filter((l) => l.category === "hot").length);
    setWarmCount(leads.filter((l) => l.category === "warm").length);
    setColdCount(leads.filter((l) => l.category === "cold").length);
  }, [leads]);

  function handleExport() {
    window.open("/api/leads/export", "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track prospective students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <CreateLeadDialog onLeadCreated={() => fetchLeads(pagination.page)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-600">Hot Leads</span>
            <span className="text-2xl font-bold">{hotCount}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Score 60+</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-600">Warm Leads</span>
            <span className="text-2xl font-bold">{warmCount}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Score 20-59</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">Cold Leads</span>
            <span className="text-2xl font-bold">{coldCount}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Score &lt;20</p>
        </div>
      </div>

      <LeadFilters
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <LeadTable
            leads={leads}
            sort={sort}
            order={order}
            onSort={handleSort}
            onSelect={setSelectedLeadId}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} leads
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchLeads(pagination.page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-xs">...</span>
                    )}
                    <Button
                      variant={p === pagination.page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => fetchLeads(p)}
                    >
                      {p}
                    </Button>
                  </span>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <LeadDetailSheet
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={() => fetchLeads(pagination.page)}
      />
    </div>
  );
}
