import type {
  NextFunction,
  Request,
  Response
} from "express";

type Entry = {
  count: number;
  resetAt: number;
};

type Options = {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
};

const buckets = new Map<string, Entry>();

export function createRateLimit(options: Options) {
  return function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const now = Date.now();
    const identity =
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `${options.prefix}:${identity}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs
      });

      return next();
    }

    if (current.count >= options.max) {
      const retryAfter = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", String(retryAfter));

      return res.status(429).json({
        error:
          options.message ||
          "Muitas solicitações. Tente novamente em alguns minutos."
      });
    }

    current.count += 1;
    buckets.set(key, current);

    next();
  };
}

export const loginRateLimit = createRateLimit({
  prefix: "login",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
});

export const registerRateLimit = createRateLimit({
  prefix: "register",
  windowMs: 60 * 60 * 1000,
  max: 5,
  message:
    "Muitas tentativas de cadastro. Tente novamente mais tarde."
});

export const resetRateLimit = createRateLimit({
  prefix: "password-reset",
  windowMs: 60 * 60 * 1000,
  max: 6
});

export const mutationRateLimit = createRateLimit({
  prefix: "mutation",
  windowMs: 60 * 1000,
  max: 40
});

export const reportRateLimit = createRateLimit({
  prefix: "report",
  windowMs: 60 * 60 * 1000,
  max: 10
});
