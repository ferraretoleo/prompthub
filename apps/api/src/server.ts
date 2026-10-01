import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./lib/env.js";
import authRoutes from "./routes/auth.js";
import promptRoutes from "./routes/prompts.js";
import categoryRoutes from "./routes/categories.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: false }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "prompthub-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/categories", categoryRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API_ERROR", err instanceof Error ? err.message : "erro desconhecido");
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(env.PORT, "0.0.0.0", () => console.log(`PromptHub API ouvindo em 0.0.0.0:${env.PORT}`));
