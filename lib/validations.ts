import { z } from "zod";

// Phone number validation — Indian format
const phoneRegex = /^[6-9]\d{9}$/;

export const LeadSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .transform((val) => val.trim()),

  phone: z
    .string()
    .regex(phoneRegex, "Invalid Indian phone number (must start with 6-9 and be 10 digits)"),

  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City name too long")
    .regex(/^[a-zA-Z\s]+$/, "City can only contain letters and spaces")
    .transform((val) => val.trim()),

  serviceId: z
    .string()
    .uuid("Invalid service ID"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description too long — max 500 characters")
    .transform((val) => val.trim()),
});

export const WebhookSchema = z.object({
  idempotencyKey: z
    .string()
    .min(1, "idempotencyKey is required")
    .max(200, "idempotencyKey too long"),

  eventType: z
    .string()
    .min(1, "eventType is required")
    .regex(/^[a-z.]+$/, "eventType must be lowercase with dots only"),

  payload: z
    .record(z.unknown())
    .optional()
    .default({}),
});

// Standard API error response builder
export function buildErrorResponse(
  message: string,
  status: number,
  details?: unknown
) {
  return {
    success: false,
    error: message,
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
  };
}

// Standard API success response builder
export function buildSuccessResponse(data: unknown) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}