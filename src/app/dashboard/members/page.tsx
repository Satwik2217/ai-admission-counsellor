"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, MessageSquare, Mail, Shield, Trash2 } from "lucide-react";

interface Member {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
  conversationsAssigned: number;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.[0] || "";
  const last = lastName?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = () => {
    fetch("/api/members")
      .then((res) => res.ok && res.json())
      .then((json) => {
        if (json) setMembers(json.members);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) fetchMembers();
    } catch {
      // ignore
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
      if (res.ok) fetchMembers();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const owners = members.filter((m) => m.role === "OWNER").length;
  const totalConversations = members.reduce((sum, m) => sum + m.conversationsAssigned, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Counselors</h1>
        <p className="text-sm text-muted-foreground">
          Manage your team members and their roles
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Counselors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">{owners} owner, {members.length - owners} staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(totalConversations / members.length || 0).toFixed(1)} per counselor
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="text-primary">OWNER</span>
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-muted-foreground">STAFF</span>
            </div>
            <p className="text-xs text-muted-foreground">Owners manage settings and members</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border text-sm text-muted-foreground">
            No team members found.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {member.firstName || member.lastName
                      ? `${member.firstName || ""} ${member.lastName || ""}`.trim()
                      : "Unnamed"}
                  </span>
                  <Badge
                    variant={member.role === "OWNER" ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {member.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {member.conversationsAssigned} conversations
                  </span>
                  <span>Joined {formatDate(member.joinedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={member.role}
                  onValueChange={(val) => handleRoleChange(member.id, val)}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF" className="text-xs">Staff</SelectItem>
                    <SelectItem value="OWNER" className="text-xs">Owner</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(member.id, member.firstName || member.email)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
