import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        assignments: {
          include: {
            lead: {
              include: { service: true },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      monthlyQuota: provider.monthlyQuota,
      leadsThisMonth: provider.leadsThisMonth,
      remainingQuota: provider.monthlyQuota - provider.leadsThisMonth,
      quotaResetAt: provider.quotaResetAt,
      leads: provider.assignments.map((a) => ({
        id: a.lead.id,
        name: a.lead.name,
        phone: a.lead.phone,
        city: a.lead.city,
        service: a.lead.service.name,
        assignmentType: a.assignmentType,
        assignedAt: a.assignedAt,
      })),
    }));

    return NextResponse.json({ providers: data });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}