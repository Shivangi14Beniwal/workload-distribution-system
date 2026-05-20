import prisma from "@/lib/db";

const TOTAL_ASSIGNMENTS = 3;

export async function allocateLead(leadId: string, serviceId: string) {
  // Step 1: Get mandatory rules
  const mandatoryRules = await prisma.mandatoryRule.findMany({
    where: { serviceId },
    include: { provider: true },
  });

  const assignedProviderIds: string[] = [];
  const assignments = [];

  // Step 2: Assign mandatory providers
  for (const rule of mandatoryRules) {
    if (assignedProviderIds.length >= TOTAL_ASSIGNMENTS) break;

    const provider = await prisma.provider.findUnique({
      where: { id: rule.providerId },
    });

    if (!provider) continue;

    if (provider.leadsThisMonth < provider.monthlyQuota) {
      assignedProviderIds.push(rule.providerId);
      assignments.push({
        leadId,
        providerId: rule.providerId,
        assignmentType: "MANDATORY" as const,
      });

      await prisma.provider.update({
        where: { id: rule.providerId },
        data: { leadsThisMonth: { increment: 1 } },
      });
    }
  }

  // Step 3: Fill remaining slots with fair rotation
  const slotsNeeded = TOTAL_ASSIGNMENTS - assignedProviderIds.length;

  if (slotsNeeded > 0) {
    const poolStates = await prisma.allocationState.findMany({
      where: { serviceId },
      include: { provider: true },
      orderBy: { assignedCount: "asc" },
    });

    for (const state of poolStates) {
      if (assignments.length >= TOTAL_ASSIGNMENTS) break;

      const isExcluded = assignedProviderIds.includes(state.providerId);
      const hasQuota =
        state.provider.leadsThisMonth < state.provider.monthlyQuota;

      if (!isExcluded && hasQuota) {
        assignedProviderIds.push(state.providerId);
        assignments.push({
          leadId,
          providerId: state.providerId,
          assignmentType: "FAIR_ROTATION" as const,
        });

        await prisma.provider.update({
          where: { id: state.providerId },
          data: { leadsThisMonth: { increment: 1 } },
        });

        await prisma.allocationState.update({
          where: { id: state.id },
          data: { assignedCount: { increment: 1 } },
        });
      }
    }
  }

  // Step 4: Save assignments
  await prisma.leadAssignment.createMany({
    data: assignments,
  });

  // Step 5: Audit log
  await prisma.auditLog.create({
    data: {
      leadId,
      action: "LEAD_ASSIGNED",
      metadata: {
        serviceId,
        totalAssigned: assignments.length,
        mandatory: assignments
          .filter((a) => a.assignmentType === "MANDATORY")
          .map((a) => a.providerId),
        fairRotation: assignments
          .filter((a) => a.assignmentType === "FAIR_ROTATION")
          .map((a) => a.providerId),
      },
    },
  });

  return assignments;
}