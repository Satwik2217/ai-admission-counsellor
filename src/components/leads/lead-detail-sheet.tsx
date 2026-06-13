"use client";

import { useState, useEffect, useCallback } from "react";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadCategoryBadge } from "./lead-category-badge";
import { LeadScoring } from "./lead-scoring";
import { LeadNotes } from "./lead-notes";
import { LeadActivityTimeline } from "./lead-activity-timeline";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/lib/leads/constants";
import { Phone, Mail, BookOpen, Globe, X, Loader2, Trash2 } from "lucide-react";

interface LeadDetail {
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
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null };
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface LeadDetailSheetProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export function LeadDetailSheet({ leadId, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interestedCourse: "",
    source: "",
    status: "",
  });

  const loadLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const json = await res.json();
        setLead(json.lead);
        setForm({
          name: json.lead.name,
          phone: json.lead.phone || "",
          email: json.lead.email || "",
          interestedCourse: json.lead.interestedCourse || "",
          source: json.lead.source,
          status: json.lead.status,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      loadLead();
      setEditing(false);
    } else {
      setLead(null);
    }
  }, [leadId, loadLead]);

  async function handleSave() {
    if (!lead || !form.name.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        loadLead();
        onLeadUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lead || deleting) return;
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) {
        onClose();
        onLeadUpdated();
      }
    } finally {
      setDeleting(false);
    }
  }

  function getSourceLabel(value: string): string {
    return LEAD_SOURCES.find((s) => s.value === value)?.label || value;
  }

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background shadow-xl border-l overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <h2 className="text-sm font-semibold">Lead Details</h2>
          <div className="flex items-center gap-1">
            {lead && !editing && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8">
                  Edit
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {lead && !loading && (
          <div className="p-4 space-y-6">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Course</label>
                  <input
                    type="text"
                    value={form.interestedCourse}
                    onChange={(e) => setForm({ ...form, interestedCourse: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Source</label>
                    <select
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      {LEAD_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
                    {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{lead.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <LeadCategoryBadge category={lead.category} />
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <LeadScoring score={lead.score} />
                  </div>
                </div>

                <div className="space-y-2">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                    </div>
                  )}
                  {lead.interestedCourse && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.interestedCourse}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{getSourceLabel(lead.source)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Created {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
                  <LeadActivityTimeline activities={lead.activities} />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <LeadNotes notes={lead.notes} leadId={lead.id} onNoteAdded={loadLead} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
