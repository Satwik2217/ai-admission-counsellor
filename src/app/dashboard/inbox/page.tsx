import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard/onboarding");

  const teamMembers = await prisma.membership.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
      },
    },
  });

  return (
    <div className="h-full">
      <InboxView
        _organizationId={membership.organizationId}
        currentUserId={userId}
        teamMembers={teamMembers.map((m) => m.user)}
      />
    </div>
  );
}
