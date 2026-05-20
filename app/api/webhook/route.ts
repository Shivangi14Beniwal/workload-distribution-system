import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idempotencyKey, eventType, payload } = body;

    if (!idempotencyKey || !eventType) {
      return NextResponse.json(
        { error: "idempotencyKey and eventType are required" },
        { status: 400 }
      );
    }

    // Check if already processed — idempotency check
    const existing = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      if (existing.status === "PROCESSED") {
        return NextResponse.json(
          {
            success: true,
            message: "Already processed — idempotent response",
            idempotencyKey,
          },
          { status: 200 }
        );
      }
    }

    // Create webhook event record
    const webhookEvent = await prisma.webhookEvent.upsert({
      where: { idempotencyKey },
      update: {},
      create: {
        idempotencyKey,
        eventType,
        status: "PENDING",
        payload: payload || {},
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
          responsePayload: { message: "All provider quotas reset to 0" },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "QUOTA_RESET",
          metadata: { idempotencyKey, eventType },
        },
      });

      return NextResponse.json({
        success: true,
        message: "All provider quotas have been reset",
      });
    }

    return NextResponse.json(
      { error: "Unknown event type" },
      { status: 400 }
    );

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}