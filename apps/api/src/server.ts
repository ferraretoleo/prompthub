import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./lib/env.js";
import authRoutes from "./routes/auth.js";
import promptRoutes from "./routes/prompts.js";
import categoryRoutes from "./routes/categories.js";
import communityRoutes from "./routes/community.js";
import reportRoutes from "./routes/reports.js";
import { mutationRateLimit } from "./middleware/rateLimit.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: false
}));

app.use(express.json({
  limit: "2mb"
}));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "prompthub-api"
  });
});

app.use("/api/auth", authRoutes);

app.use(
  "/api/prompts",
  (req, res, next) => {
    if (
      req.method === "POST" ||
      req.method === "PATCH" ||
      req.method === "DELETE"
    ) {
      return mutationRateLimit(req, res, next);
    }

    next();
  },
  promptRoutes
);

app.use("/api/categories", categoryRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/reports", reportRoutes);

app.use((
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error(
    "API_ERROR",
    err instanceof Error
      ? err.message
      : "erro desconhecido"
  );

  res.status(500).json({
    error: "Erro interno do servidor"
  });
});

app.listen(
  env.PORT,
  "0.0.0.0",
  () => {
    console.log(
      `PromptHub API ouvindo em 0.0.0.0:${env.PORT}`
    );
  }
);
