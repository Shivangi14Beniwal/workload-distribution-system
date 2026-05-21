import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
  "/api/leads": { limit: 10, windowMs: 60 * 1000 },
  "/api/webhook": { limit: 20, windowMs: 60 * 1000 },
  "/api/services": { limit: 60, windowMs: 60 * 1000 },
  "/api/dashboard": { limit: 60, windowMs: 60 * 1000 },
};

function getRateLimit(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pathname.startsWith(path)) return config;
  }
  return null;
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const config = getRateLimit(pathname);

  if (!config) return NextResponse.next();

  const ip = getClientIP(req);
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return NextResponse.next();
  }

  record.count++;

  if (record.count > config.limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfterSeconds: retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/leads/:path*", "/api/webhook/:path*", "/api/services/:path*", "/api/dashboard/:path*"],
};