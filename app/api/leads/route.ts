import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { allocateLead } from "@/lib/allocation/engine";
import { LeadSchema, buildErrorResponse, buildSuccessResponse } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        buildErrorResponse("Invalid JSON body", 400),
        { status: 400 }
      );
    }

    // Validate + sanitize input
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        buildErrorResponse(
          "Validation failed",
          400,
          parsed.error.flatten().fieldErrors
        ),
        { status: 400 }
      );
    }

    const { name, phone, city, serviceId, description } = parsed.data;

    // Check service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json(
        buildErrorResponse("Service not found", 404),
        { status: 404 }
      );
    }

    // Create lead — DB unique constraint catches duplicates
    let lead;
    try {
      lead = await prisma.lead.create({
        data: { name, phone, city, serviceId, description },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        return NextResponse.json(
          buildErrorResponse(
            "You have already submitted a request for this service with this phone number.",
            409
          ),
          { status: 409 }
        );
      }
      throw err;
    }

    // Audit log — lead created
    await prisma.auditLog.create({
      data: {
        leadId: lead.id,
        action: "LEAD_CREATED",
        metadata: { name, phone, city, serviceId, serviceName: service.name },
      },
    });

    // Run allocation engine
    let assignments;
    try {
      assignments = await allocateLead(lead.id, serviceId);
    } catch (err) {
      // Allocation failed — log it but don't fail the request
      // Lead is saved, manual allocation can happen later
      await prisma.auditLog.create({
        data: {
          leadId: lead.id,
          action: "ALLOCATION_FAILED",
          metadata: {
            error: err instanceof Error ? err.message : "Unknown error",
          },
        },
      });

      return NextResponse.json(
        buildSuccessResponse({
          leadId: lead.id,
          assignedProviders: 0,
          warning: "Lead saved but allocation failed. Will retry.",
        }),
        { status: 201 }
      );
    }

    // Notify SSE clients
    notifyDashboard();

    return NextResponse.json(
      buildSuccessResponse({
        leadId: lead.id,
        assignedProviders: assignments.length,
        service: service.name,
      }),
      { status: 201 }
    );

  } catch (err) {
    console.error("Lead creation error:", err);
    return NextResponse.json(
      buildErrorResponse("Internal server error", 500),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
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

    return NextResponse.json(buildSuccessResponse({ leads }));
  } catch (err) {
    console.error("Leads fetch error:", err);
    return NextResponse.json(
      buildErrorResponse("Internal server error", 500),
      { status: 500 }
    );
  }
}

// SSE clients store
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