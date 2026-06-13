import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/ai-receptionist/chat-interface";

export default async function CounselorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
  });

  if (!membership) redirect("/dashboard/onboarding");
  if (!membership.organization.onboardingComplete) redirect("/dashboard/onboarding");

  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}
