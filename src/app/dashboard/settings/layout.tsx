import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, CreditCard, Users, CalendarDays, Code } from "lucide-react";

const settingsNav = [
  { name: "General", href: "/dashboard/settings/general", icon: Settings },
  { name: "Appointments", href: "/dashboard/settings/appointments", icon: CalendarDays },
  { name: "Widget", href: "/dashboard/settings/widget", icon: Code },
  { name: "Members", href: "/dashboard/settings/members", icon: Users },
  { name: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="md:w-48">
          <nav className="flex flex-col gap-1">
            {settingsNav.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="justify-start gap-2"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <div className="flex-1">
          <Card>
            <CardContent className="pt-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
