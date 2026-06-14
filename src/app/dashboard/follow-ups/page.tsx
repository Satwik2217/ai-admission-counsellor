"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Clock, Smartphone, Globe, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface FollowUpRule {
  id: string;
  name: string;
  trigger: string;
  delayHours: number;
  channel: string;
  template: string;
  enabled: boolean;
  createdAt: string;
}

interface FollowUpLog {
  id: string;
  rule: { name: string };
  conversation: { id: string; studentName?: string | null; phone?: string | null; channel: string };
  status: string;
  error?: string | null;
  scheduledAt: string;
  sentAt?: string | null;
  createdAt: string;
}

function formDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

export default function FollowUpsPage() {
  const [tab, setTab] = useState<"rules" | "logs">("rules");
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [logs, setLogs] = useState<FollowUpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "no_response",
    delayHours: "24",
    channel: "WHATSAPP",
    template: "",
  });

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/follow-ups/rules");
      if (res.ok) {
        const json = await res.json();
        setRules(json.rules);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/follow-ups/logs?limit=50");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const fetchData = tab === "rules" ? fetchRules : fetchLogs;
    fetchData().finally(() => setLoading(false));
  }, [tab, fetchRules, fetchLogs]);

  const handleCreate = async () => {
    if (!form.name || !form.template) return;
    setSaving(true);
    try {
      const res = await fetch("/api/follow-ups/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          trigger: form.trigger,
          delayHours: Number(form.delayHours),
          channel: form.channel,
          template: form.template,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", trigger: "no_response", delayHours: "24", channel: "WHATSAPP", template: "" });
        fetchRules();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: FollowUpRule) => {
    try {
      await fetch(`/api/follow-ups/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      fetchRules();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/follow-ups/rules/${id}`, { method: "DELETE" });
      fetchRules();
    } catch {
      // ignore
    }
  };

  const triggerLabels: Record<string, string> = {
    no_response: "No Response",
    lead_not_converted: "Lead Not Converted",
  };

  const channelIcons: Record<string, React.ReactNode> = {
    WEBSITE: <Globe className="h-3.5 w-3.5" />,
    WHATSAPP: <Smartphone className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-up Automation</h1>
          <p className="text-sm text-muted-foreground">
            Automate follow-up messages for leads and conversations
          </p>
        </div>
        {tab === "rules" && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Follow-up Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. WhatsApp No-Reply Follow-up"
                  />
                </div>
                <div>
                  <Label>Trigger</Label>
                  <Select
                    value={form.trigger}
                    onValueChange={(v) => setForm({ ...form, trigger: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_response">No Response</SelectItem>
                      <SelectItem value="lead_not_converted">Lead Not Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delay (hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.delayHours}
                    onChange={(e) => setForm({ ...form, delayHours: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select
                    value={form.channel}
                    onValueChange={(v) => setForm({ ...form, channel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="ALL">All Channels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message Template</Label>
                  <Textarea
                    value={form.template}
                    onChange={(e) => setForm({ ...form, template: e.target.value })}
                    placeholder="e.g. Hi {{name}}, this is a follow-up from the institute..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setTab("rules")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "rules" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Rules
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "logs" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "rules" ? (
        rules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No follow-up rules yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first rule to automate follow-up messages
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {triggerLabels[rule.trigger] || rule.trigger}
                    </Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {channelIcons[rule.channel]}
                      {rule.channel === "ALL" ? "All" : rule.channel}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rule.delayHours}h delay
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rule.template}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(rule.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant={rule.enabled ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No follow-up history</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow-up logs will appear here once rules are triggered
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 text-sm">
                    {log.status === "sent" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    ) : log.status === "failed" ? (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {log.conversation.studentName || log.conversation.phone || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Rule: {log.rule.name}
                      </p>
                      {log.error && (
                        <p className="text-xs text-destructive truncate">{log.error}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formDateTime(log.sentAt || log.scheduledAt)}</p>
                      <Badge
                        variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"}
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
