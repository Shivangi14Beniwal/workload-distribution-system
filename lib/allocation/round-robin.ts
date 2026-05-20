import prisma from "@/lib/db";

export async function getNextProviders(
  serviceId: string,
  excludeProviderIds: string[],
  slotsNeeded: number
): Promise<string[]> {

  const states = await prisma.allocationState.findMany({
    where: { serviceId },
    include: { provider: true },
    orderBy: { assignedCount: "asc" },
  });

  if (states.length === 0) return [];

  const selected: string[] = [];

  for (const state of states) {
    if (selected.length >= slotsNeeded) break;

    const isExcluded = excludeProviderIds.includes(state.providerId);
    const isAlreadySelected = selected.includes(state.providerId);
    const hasQuota = state.provider.leadsThisMonth < state.provider.monthlyQuota;

    if (!isExcluded && !isAlreadySelected && hasQuota) {
      selected.push(state.providerId);

      await prisma.allocationState.update({
        where: { id: state.id },
        data: { assignedCount: { increment: 1 } },
      });
    }
  }

  return selected;
}