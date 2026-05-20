import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { allocateLead } from "@/lib/allocation/engine";
import { z } from "zod";

const LeadSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  city: z.string().min(1, "City required"),
  serviceId: z.string().uuid("Valid service required"),
  description: z.string().min(1, "Description required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone, city, serviceId, description } = parsed.data;

    // Create lead — DB will throw P2002 if same phone+service exists
    let lead;
    try {
      lead = await prisma.lead.create({
        data: { name, phone, city, serviceId, description },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "You have already submitted a request for this service." },
          { status: 409 }
        );
      }
      throw err;
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        leadId: lead.id,
        action: "LEAD_CREATED",
        metadata: { name, phone, city, serviceId },
      },
    });

    // Allocate providers
    const assignments = await allocateLead(lead.id, serviceId);

    // Notify SSE clients
    notifyDashboard();

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        assignedProviders: assignments.length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Lead creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const leads = await prisma.lead.findMany({
    include: {
      service: true,
      assignments: {
        include: { provider: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ leads });
}

// SSE notification — will be connected in sse/route.ts
let sseClients: ReadableStreamDefaultController[] = [];

export function addSSEClient(controller: ReadableStreamDefaultController) {
  sseClients.push(controller);
}

export function removeSSEClient(controller: ReadableStreamDefaultController) {
  sseClients = sseClients.filter((c) => c !== controller);
}

export function notifyDashboard() {
  sseClients.forEach((client) => {
    try {
      client.enqueue(`data: update\n\n`);
    } catch {}
  });
}