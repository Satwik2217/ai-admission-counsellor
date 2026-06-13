"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserMinus } from "lucide-react";

export default function MembersSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Team Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage who has access to your organization.
        </p>
      </div>
      <Separator />
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        No members yet. Invite your team to get started.
      </div>
    </div>
  );
}
