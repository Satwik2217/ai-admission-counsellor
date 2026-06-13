import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { OrgCreationForm } from "./org-creation-form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
  });

  if (!membership) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to AI Admission Counselor
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Let&apos;s set up your organization to get started.
            </p>
          </div>
          <OrgCreationForm />
        </div>
      </div>
    );
  }

  if (membership.organization.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Set Up Your Institute
          </h1>
          <p className="text-muted-foreground">
            Complete these steps to configure your institute profile.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
