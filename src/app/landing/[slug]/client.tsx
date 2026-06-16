"use client";

import { useState, useEffect, FormEvent } from "react";
import { GraduationCap, Send, CheckCircle, Loader2 } from "lucide-react";

interface CampaignData {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  subtitle: string | null;
  ctaText: string;
  buttonColor: string;
  fields: unknown;
}

export function LandingPageClient({
  campaign,
  orgName,
}: {
  campaign: CampaignData;
  orgName: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", course: "" });

  useEffect(() => {
    fetch(`/api/campaigns/public/${campaign.slug}/track-view`, { method: "POST" }).catch(() => {});
  }, [campaign.slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/public/${campaign.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const showField = (field: string) => {
    if (!campaign.fields) return true;
    const fields = typeof campaign.fields === "string"
      ? JSON.parse(campaign.fields as string)
      : campaign.fields;
    return fields.includes(field);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-xl font-semibold">Thank You!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve received your enquiry. Our team will get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  const accentColor = campaign.buttonColor || "#7C3AED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm" style={{ color: accentColor }}>
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {campaign.headline || campaign.name}
          </h1>
          {campaign.subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{campaign.subtitle}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {showField("name") && (
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                  placeholder="Enter your name"
                />
              </div>
            )}
            {showField("phone") && (
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
            )}
            {showField("email") && (
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            )}
            {showField("course") && (
              <div>
                <label className="text-sm font-medium">Interested Course</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
                  placeholder="e.g. Engineering, Medical"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-70"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {campaign.ctaText || "Submit"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by {orgName}
        </p>
      </div>
    </div>
  );
}
