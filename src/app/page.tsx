import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Bot, Shield, Building2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              AI Admission Counselor
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI-Powered Admission Counseling
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Transform your institute&apos;s admission process with intelligent AI counseling.
              Guide students, manage applications, and boost conversions — all in one platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Everything you need to grow
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              Powerful tools for coaching institutes, tuition centers, and educational consultancies.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border bg-background p-6">
                <Bot className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">AI Counseling</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Intelligent chatbot that answers student queries 24/7 with accurate, RAG-based responses.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <Building2 className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">Multi-Tenant SaaS</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Each institute gets isolated data and branding. Perfect for chains and franchises.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <Shield className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">Secure & Scalable</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enterprise-grade security with role-based access control and data isolation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container mx-auto px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to transform your admissions?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands of institutes using AI Admission Counselor.
            </p>
            <div className="mt-8">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6">
          &copy; {new Date().getFullYear()} AI Admission Counselor. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
