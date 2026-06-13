import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Mail, BookOpen, Target, Users } from "lucide-react";

interface LeadInfo {
  studentName?: string | null;
  parentName?: string | null;
  phone?: string | null;
  email?: string | null;
  classField?: string | null;
  targetExam?: string | null;
}

interface LeadPanelProps {
  lead: LeadInfo | null;
  loading?: boolean;
}

export function LeadPanel({ lead, loading }: LeadPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!lead || !Object.values(lead).some((v) => v)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Lead details will appear here as the conversation progresses.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    { label: "Student", value: lead.studentName, icon: User },
    { label: "Parent", value: lead.parentName, icon: Users },
    { label: "Phone", value: lead.phone, icon: Phone },
    { label: "Email", value: lead.email, icon: Mail },
    { label: "Class", value: lead.classField, icon: BookOpen },
    { label: "Target", value: lead.targetExam, icon: Target },
  ];

  const capturedFields = fields.filter((f) => f.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Lead Information</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {capturedFields.length}/6
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center gap-2">
            <field.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{field.label}</p>
              <p className="text-sm font-medium truncate">
                {field.value || "—"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
