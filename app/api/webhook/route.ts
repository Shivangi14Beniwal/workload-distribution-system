import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { WebhookSchema, buildErrorResponse, buildSuccessResponse } from "@/lib/validations";

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

    // Validate input
    const parsed = WebhookSchema.safeParse(body);
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

    const { idempotencyKey, eventType, payload } = parsed.data;

    // Idempotency check — already processed?
    const existing = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing?.status === "PROCESSED") {
      return NextResponse.json(
        buildSuccessResponse({
          message: "Already processed — idempotent response",
          idempotencyKey,
          processedAt: existing.processedAt,
        }),
        { status: 200 }
      );
    }

    // Create or get webhook event record
    const webhookEvent = await prisma.webhookEvent.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        idempotencyKey,
        eventType,
        status: "PENDING",
        payload: payload as object,
      },
    });

    // Handle quota reset event
    if (eventType === "quota.reset") {
      await prisma.provider.updateMany({
        data: {
          leadsThisMonth: 0,
          quotaResetAt: new Date(),
        },
      });

      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          responsePayload: {
            message: "All provider quotas reset to 0",
            resetAt: new Date().toISOString(),
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "QUOTA_RESET",
          metadata: { idempotencyKey, eventType, triggeredAt: new Date() },
        },
      });

      return NextResponse.json(
        buildSuccessResponse({
          message: "All provider quotas have been reset",
          resetAt: new Date().toISOString(),
        })
      );
    }

    // Unknown event type
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      buildErrorResponse(`Unknown event type: ${eventType}`, 400),
      { status: 400 }
    );

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      buildErrorResponse("Internal server error", 500),
      { status: 500 }
    );
  }
}