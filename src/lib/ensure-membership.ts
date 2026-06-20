import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureMembership(userId: string) {
  const existing = await prisma.membership.findFirst({ where: { userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Could not fetch user from Clerk");

  const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.dev`;

  await prisma.user.deleteMany({
    where: { email, id: { not: userId } },
  });

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      id: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return prisma.$transaction(async (tx) => {
    const slug = `org-${userId.slice(0, 8)}`;
    const org = await tx.organization.create({
      data: {
        name: "My Institute",
        slug,
        greetingMessage: "Welcome! How can I help you today?",
      },
    });

    const membership = await tx.membership.create({
      data: {
        organizationId: org.id,
        userId,
        role: "OWNER",
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: org.id,
        status: "INACTIVE",
        plan: "free",
      },
    });

    return membership;
  });
}
