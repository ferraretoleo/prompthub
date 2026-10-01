import { Router } from "express";
import { asc } from "drizzle-orm";
import { createDb, categories } from "@prompthub/database";

const router = Router();
const db = createDb();
router.get("/", async (_req, res) => {
  res.json({ items: await db.select().from(categories).orderBy(asc(categories.name)) });
});
export default router;
