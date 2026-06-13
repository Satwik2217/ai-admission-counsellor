"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Settings,
  Users,
  GraduationCap,
  FileText,
  BarChart3,
  Bot,
  HelpCircle,
  BookOpen,
  Contact,
  CalendarDays,
  Shield,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Contact },
  { name: "Appointments", href: "/dashboard/appointments", icon: CalendarDays },
  { name: "Students", href: "/dashboard/students", icon: GraduationCap },
  { name: "Applications", href: "/dashboard/applications", icon: FileText },
  { name: "AI Counselor", href: "/dashboard/counselor", icon: Bot },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "FAQs", href: "/dashboard/faqs", icon: HelpCircle },
  { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: BookOpen },
  { name: "Team", href: "/dashboard/members", icon: Users },
  { name: "Admin", href: "/dashboard/admin", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="px-3 py-2">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            AI Admission
          </span>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-secondary font-medium"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      <Separator />
      <div className="px-3 py-2">
        <p className="px-2 text-xs text-muted-foreground">
          AI Admission Counselor v0.1
        </p>
      </div>
    </div>
  );
}
