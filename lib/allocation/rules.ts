import prisma from "@/lib/db";

export async function getMandatoryProviders(serviceId: string) {
  const rules = await prisma.mandatoryRule.findMany({
    where: { serviceId },
    include: { provider: true },
  });

  return rules.map((r) => r.provider);
}