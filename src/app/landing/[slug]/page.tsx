import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingPageClient } from "./client";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { slug, isActive: true },
    include: { organization: { select: { name: true, logo: true } } },
  });

  if (!campaign) notFound();

  return <LandingPageClient campaign={campaign} orgName={campaign.organization.name} />;
}
