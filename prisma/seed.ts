import { PrismaClient, AssignmentType } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICES = [
  { name: "Service 1", slug: "service-1" },
  { name: "Service 2", slug: "service-2" },
  { name: "Service 3", slug: "service-3" },
];

const PROVIDERS = Array.from({ length: 8 }, (_, i) => ({
  name: `Provider ${i + 1}`,
  monthlyQuota: 10,
  leadsThisMonth: 0,
}));

const POOL_MAP: Record<string, string[]> = {
  "service-1": ["Provider 2", "Provider 3", "Provider 4"],
  "service-2": ["Provider 6", "Provider 7", "Provider 8"],
  "service-3": ["Provider 2", "Provider 3", "Provider 5", "Provider 6", "Provider 7", "Provider 8"],
};

const MANDATORY_MAP: Record<string, string[]> = {
  "service-1": ["Provider 1"],
  "service-2": ["Provider 5"],
  "service-3": ["Provider 1", "Provider 4"],
};

async function main() {
  console.log("🌱 Seeding database...\n");

  const serviceMap: Record<string, string> = {};
  for (const service of SERVICES) {
    const created = await prisma.service.upsert({
      where: { slug: service.slug },
      update: { name: service.name },
      create: service,
    });
    serviceMap[service.slug] = created.id;
    console.log(`✓ ${service.name}`);
  }

  const providerMap: Record<string, string> = {};
  for (const provider of PROVIDERS) {
    const created = await prisma.provider.upsert({
      where: { name: provider.name },
      update: {},
      create: provider,
    });
    providerMap[provider.name] = created.id;
    console.log(`✓ ${provider.name}`);
  }

  for (const [serviceSlug, providerNames] of Object.entries(MANDATORY_MAP)) {
    const serviceId = serviceMap[serviceSlug];
    for (const providerName of providerNames) {
      const providerId = providerMap[providerName];
      await prisma.mandatoryRule.upsert({
        where: { serviceId_providerId: { serviceId, providerId } },
        update: {},
        create: { serviceId, providerId },
      });
      console.log(`✓ Mandatory: ${serviceSlug} → ${providerName}`);
    }
  }

  for (const [serviceSlug, providerNames] of Object.entries(POOL_MAP)) {
    const serviceId = serviceMap[serviceSlug];
    for (const providerName of providerNames) {
      const providerId = providerMap[providerName];
      await prisma.allocationState.upsert({
        where: { serviceId_providerId: { serviceId, providerId } },
        update: {},
        create: { serviceId, providerId, pointer: 0, assignedCount: 0 },
      });
      console.log(`✓ Pool: ${serviceSlug} → ${providerName}`);
    }
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });