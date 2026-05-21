import prisma from "@/lib/db";

const TOTAL_ASSIGNMENTS = 3;

// PostgreSQL Advisory Lock ID for allocation
// Same number = same lock = only one transaction runs at a time
const ALLOCATION_LOCK_ID = 123456789;

export async function allocateLead(leadId: string, serviceId: string) {
  
  // Step 1: Acquire PostgreSQL Advisory Lock
  // This ensures only ONE allocation runs at a time
  // If another request is running, this WAITS until it's done
  // No timeout issues — no transaction needed
  await prisma.$executeRaw`
    SELECT pg_advisory_lock(${ALLOCATION_LOCK_ID})
  `;

  try {
    // Step 2: Get mandatory rules
    const mandatoryRules = await prisma.mandatoryRule.findMany({
      where: { serviceId },
      include: { provider: true },
    });

    const assignedProviderIds: string[] = [];
    const assignments: {
      leadId: string;
      providerId: string;
      assignmentType: "MANDATORY" | "FAIR_ROTATION";
    }[] = [];

    // Step 3: Assign mandatory providers
    for (const rule of mandatoryRules) {
      if (assignedProviderIds.length >= TOTAL_ASSIGNMENTS) break;

      // Re-fetch provider INSIDE lock for fresh quota data
      const provider = await prisma.provider.findUnique({
        where: { id: rule.providerId },
      });

      if (!provider) continue;

      if (provider.leadsThisMonth < provider.monthlyQuota) {
        assignedProviderIds.push(rule.providerId);
        assignments.push({
          leadId,
          providerId: rule.providerId,
          assignmentType: "MANDATORY",
        });

        await prisma.provider.update({
          where: { id: rule.providerId },
          data: { leadsThisMonth: { increment: 1 } },
        });
      }
    }

    // Step 4: Fill remaining slots with fair rotation
    const slotsNeeded = TOTAL_ASSIGNMENTS - assignedProviderIds.length;

    if (slotsNeeded > 0) {
      // Order by assignedCount ASC = provider with least assignments gets next
      // This is persistent round-robin — survives restarts
      const poolStates = await prisma.allocationState.findMany({
        where: { serviceId },
        include: { provider: true },
        orderBy: { assignedCount: "asc" },
      });

      for (const state of poolStates) {
        if (assignments.length >= TOTAL_ASSIGNMENTS) break;

        const isExcluded = assignedProviderIds.includes(state.providerId);
        
        // Re-check quota from fresh provider data
        const freshProvider = await prisma.provider.findUnique({
          where: { id: state.providerId },
        });

        if (!freshProvider) continue;

        const hasQuota = freshProvider.leadsThisMonth < freshProvider.monthlyQuota;

        if (!isExcluded && hasQuota) {
          assignedProviderIds.push(state.providerId);
          assignments.push({
            leadId,
            providerId: state.providerId,
            assignmentType: "FAIR_ROTATION",
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

    // Step 5: Save all assignments atomically
    await prisma.leadAssignment.createMany({
      data: assignments,
      skipDuplicates: true, // Extra safety — DB constraint backup
    });

    // Step 6: Audit log
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

  } finally {
    // ALWAYS release lock — even if error occurs
    // Without this, lock stays forever and blocks all future requests
    await prisma.$executeRaw`
      SELECT pg_advisory_unlock(${ALLOCATION_LOCK_ID})
    `;
  }
}