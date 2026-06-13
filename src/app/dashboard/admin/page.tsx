"use client";

import { useState, useEffect } from "react";
import { Building2, Users, MessageSquare, CalendarDays, Mail, Loader2 } from "lucide-react";

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  leads: number;
  chats: number;
  appointments: number;
}

interface AdminStats {
  totalOrganizations: number;
  totalLeads: number;
  totalChats: number;
  totalMessages: number;
  totalAppointments: number;
  organizations: OrgSummary[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403) {
          setError("Access denied. Super admin only.");
          return;
        }
        if (res.ok) setData(await res.json());
        else setError("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Platform-wide overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Organizations</p>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{data.totalOrganizations}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{data.totalLeads}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Chats</p>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{data.totalChats}</p>
          <p className="text-xs text-muted-foreground">{data.totalMessages} messages</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Appointments</p>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{data.totalAppointments}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">Organizations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Leads</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Chats</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Appts</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.organizations.map((org) => (
                <tr key={org.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm font-medium">{org.name}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{org.slug}</td>
                  <td className="px-4 py-2.5 text-sm">{org.leads}</td>
                  <td className="px-4 py-2.5 text-sm">{org.chats}</td>
                  <td className="px-4 py-2.5 text-sm">{org.appointments}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
