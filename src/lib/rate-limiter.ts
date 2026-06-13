const store = new Map<string, { count: number; resetAt: number }>();

const FIVE_MIN = 5 * 60 * 1000;

export function rateLimit(key: string, maxRequests: number = 60, windowMs: number = FIVE_MIN): { ok: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { ok: false, remaining: 0 };
  }

  record.count++;
  return { ok: true, remaining: maxRequests - record.count };
}

export function rateLimitMiddleware(handler: (req: Request, ...args: unknown[]) => Promise<Response>, maxRequests = 60): (req: Request, ...args: unknown[]) => Promise<Response> {
  return async (req, ...args) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const route = new URL(req.url).pathname;
    const key = `${ip}:${route}`;
    const result = rateLimit(key, maxRequests);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "300",
        },
      });
    }

    return handler(req, ...args);
  };
}
