"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Copy, Check } from "lucide-react";

export default function WidgetSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/organizations/onboarding");
        if (res.ok) {
          const json = await res.json();
          setSlug(json.slug || "");
          if (json.widgetPrimaryColor) setPrimaryColor(json.widgetPrimaryColor);
          if (json.widgetDarkMode !== undefined) setDarkMode(json.widgetDarkMode);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/organizations/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetPrimaryColor: primaryColor, widgetDarkMode: darkMode }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";

  const embedCode = `<script src="${baseUrl}/widget.js" data-org="${slug}"></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Website Widget</h2>
        <p className="text-sm text-muted-foreground">
          Customize the embeddable chat widget for your website.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div>
          <Label>Primary Color</Label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-32"
            />
            <div
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
          </label>
          <Label className="cursor-pointer">Dark mode by default</Label>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-2">Embed Code</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Add this script tag to your website, just before the closing <code>&lt;/body&gt;</code> tag.
        </p>
        <div className="relative rounded-lg border bg-card p-4">
          <pre className="overflow-x-auto text-xs">{embedCode}</pre>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-2 h-7"
            onClick={handleCopy}
          >
            {copied ? (
              <><Check className="mr-1 h-3 w-3" /> Copied</>
            ) : (
              <><Copy className="mr-1 h-3 w-3" /> Copy</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-1 h-4 w-4" /> Save Changes</>
          )}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved successfully</span>}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <div className="flex items-center justify-center rounded-lg border border-dashed bg-background p-8">
          <div
            className="flex items-center gap-3 rounded-full px-5 py-3 text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="text-sm font-medium">Chat with us</span>
          </div>
        </div>
      </div>
    </div>
  );
}
