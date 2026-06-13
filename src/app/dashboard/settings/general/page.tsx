"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";

export default function GeneralSettingsPage() {
  type TabValue = "institute" | "hours" | "admission" | "greeting";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("institute");
  const [data, setData] = useState({
    phone: "",
    email: "",
    website: "",
    address: "",
    openingTime: "",
    closingTime: "",
    admissionProcess: "",
    documentsRequired: "",
    greetingMessage: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/organizations/onboarding");
        if (res.ok) {
          const json = await res.json();
          setData({
            phone: json.phone || "",
            email: json.email || "",
            website: json.website || "",
            address: json.address || "",
            openingTime: json.openingTime || "",
            closingTime: json.closingTime || "",
            admissionProcess: json.admissionProcess || "",
            documentsRequired: json.documentsRequired || "",
            greetingMessage: json.greetingMessage || "",
          });
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
      const fields: Record<string, unknown> = {};
      if (activeTab === "institute") {
        fields.phone = data.phone;
        fields.email = data.email;
        fields.website = data.website;
        fields.address = data.address;
      } else if (activeTab === "hours") {
        fields.openingTime = data.openingTime;
        fields.closingTime = data.closingTime;
      } else if (activeTab === "admission") {
        fields.admissionProcess = data.admissionProcess;
        fields.documentsRequired = data.documentsRequired;
      } else if (activeTab === "greeting") {
        fields.greetingMessage = data.greetingMessage;
      }

      const res = await fetch("/api/organizations/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Institute Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your institute&apos;s profile and configuration.
        </p>
      </div>
      <Separator />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="institute">Institute</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="admission">Admission</TabsTrigger>
          <TabsTrigger value="greeting">Greeting</TabsTrigger>
        </TabsList>

        <TabsContent value="institute" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
            />
          </div>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-opening">Opening Time</Label>
              <Input
                id="edit-opening"
                type="time"
                value={data.openingTime}
                onChange={(e) => setData({ ...data, openingTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-closing">Closing Time</Label>
              <Input
                id="edit-closing"
                type="time"
                value={data.closingTime}
                onChange={(e) => setData({ ...data, closingTime: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admission" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-process">Admission Process</Label>
            <textarea
              id="edit-process"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              value={data.admissionProcess}
              onChange={(e) => setData({ ...data, admissionProcess: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-docs">Documents Required</Label>
            <textarea
              id="edit-docs"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              value={data.documentsRequired}
              onChange={(e) => setData({ ...data, documentsRequired: e.target.value })}
            />
          </div>
        </TabsContent>

        <TabsContent value="greeting" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-greeting">Greeting Message</Label>
            <textarea
              id="edit-greeting"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              value={data.greetingMessage}
              onChange={(e) => setData({ ...data, greetingMessage: e.target.value })}
            />
          </div>
        </TabsContent>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-1 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600">Saved successfully</span>
          )}
        </div>
      </Tabs>
    </div>
  );
}
