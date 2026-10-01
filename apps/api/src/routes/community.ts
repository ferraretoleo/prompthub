import { Router } from "express";
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql
} from "drizzle-orm";
import { z } from "zod";
import {
  categories,
  createDb,
  promptTags,
  prompts,
  tags,
  users
} from "@prompthub/database";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const db = createDb();

async function attachTags<T extends { id: string }>(items: T[]) {
  if (!items.length) {
    return items.map((item) => ({ ...item, tags: [] as string[] }));
  }

  const ids = items.map((item) => item.id);

  const rows = await db
    .select({
      promptId: promptTags.promptId,
      name: tags.name
    })
    .from(promptTags)
    .innerJoin(tags, eq(promptTags.tagId, tags.id))
    .where(inArray(promptTags.promptId, ids));

  const map = new Map<string, string[]>();

  for (const row of rows) {
    const current = map.get(row.promptId) ?? [];
    current.push(row.name);
    map.set(row.promptId, current);
  }

  return items.map((item) => ({
    ...item,
    tags: map.get(item.id) ?? []
  }));
}

router.get("/explore", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const sort = String(req.query.sort ?? "recent");
  const category = String(req.query.category ?? "").trim();
  const tag = String(req.query.tag ?? "").trim();

  const conditions: any[] = [
    eq(prompts.visibility, "PUBLIC"),
    isNull(prompts.deletedAt)
  ];

  if (q) {
    conditions.push(
      or(
        ilike(prompts.title, `%${q}%`),
        ilike(prompts.description, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(users.username, `%${q}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(categories.slug, category));
  }

  let orderByValue: any = desc(prompts.updatedAt);

  if (sort === "views") {
    orderByValue = desc(prompts.viewsCount);
  }

  if (sort === "favorites") {
    orderByValue = desc(prompts.favoritesCount);
  }

  if (sort === "forks") {
    orderByValue = desc(prompts.forksCount);
  }

  let items = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      description: prompts.description,
      visibility: prompts.visibility,
      currentVersion: prompts.currentVersion,
      updatedAt: prompts.updatedAt,
      userId: prompts.userId,
      favoritesCount: prompts.favoritesCount,
      forksCount: prompts.forksCount,
      viewsCount: prompts.viewsCount,
      authorName: users.name,
      authorUsername: users.username,
      avatarUrl: users.avatarUrl,
      categoryName: categories.name,
      categorySlug: categories.slug
    })
    .from(prompts)
    .innerJoin(users, eq(prompts.userId, users.id))
    .leftJoin(categories, eq(prompts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderByValue)
    .limit(100);

  let withTags = await attachTags(items);

  if (tag) {
    const wanted = tag.toLowerCase();
    withTags = withTags.filter((item) =>
      item.tags.some((value) => value.toLowerCase() === wanted)
    );
  }

  return res.json({ items: withTags });
});

router.get("/tags", requireAuth, async (_req, res) => {
  const items = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      usageCount: sql<number>`count(${promptTags.promptId})`
    })
    .from(tags)
    .leftJoin(promptTags, eq(tags.id, promptTags.tagId))
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(desc(sql`count(${promptTags.promptId})`))
    .limit(30);

  return res.json({ items });
});

router.get("/me/stats", requireAuth, async (req, res) => {
  const userId = req.authUser!.id;

  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      publicCount: sql<number>`count(*) filter (where ${prompts.visibility} = 'PUBLIC')`,
      privateCount: sql<number>`count(*) filter (where ${prompts.visibility} = 'PRIVATE')`,
      views: sql<number>`coalesce(sum(${prompts.viewsCount}), 0)`,
      favorites: sql<number>`coalesce(sum(${prompts.favoritesCount}), 0)`,
      forks: sql<number>`coalesce(sum(${prompts.forksCount}), 0)`
    })
    .from(prompts)
    .where(
      and(
        eq(prompts.userId, userId),
        isNull(prompts.deletedAt)
      )
    );

  return res.json({
    stats: {
      total: Number(row?.total ?? 0),
      publicCount: Number(row?.publicCount ?? 0),
      privateCount: Number(row?.privateCount ?? 0),
      views: Number(row?.views ?? 0),
      favorites: Number(row?.favorites ?? 0),
      forks: Number(row?.forks ?? 0)
    }
  });
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().trim().url().max(2000).nullable().optional()
});

router.patch("/me/profile", requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados de perfil inválidos",
      details: parsed.error.flatten()
    });
  }

  const [user] = await db
    .update(users)
    .set({
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      avatarUrl: parsed.data.avatarUrl || null,
      updatedAt: new Date()
    })
    .where(eq(users.id, req.authUser!.id))
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      bio: users.bio,
      avatarUrl: users.avatarUrl
    });

  return res.json({ user });
});

router.get("/profile/:username", requireAuth, async (req, res) => {
  const raw = Array.isArray(req.params.username)
    ? req.params.username[0]
    : req.params.username;

  if (!raw) {
    return res.status(400).json({ error: "Username inválido" });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.username, raw))
    .limit(1);

  if (!user) {
    return res.status(404).json({ error: "Perfil não encontrado" });
  }

  const items = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      description: prompts.description,
      visibility: prompts.visibility,
      currentVersion: prompts.currentVersion,
      updatedAt: prompts.updatedAt,
      userId: prompts.userId,
      favoritesCount: prompts.favoritesCount,
      forksCount: prompts.forksCount,
      viewsCount: prompts.viewsCount,
      authorName: users.name,
      authorUsername: users.username,
      avatarUrl: users.avatarUrl,
      categoryName: categories.name
    })
    .from(prompts)
    .innerJoin(users, eq(prompts.userId, users.id))
    .leftJoin(categories, eq(prompts.categoryId, categories.id))
    .where(
      and(
        eq(prompts.userId, user.id),
        eq(prompts.visibility, "PUBLIC"),
        isNull(prompts.deletedAt)
      )
    )
    .orderBy(desc(prompts.updatedAt));

  const withTags = await attachTags(items);

  const [stats] = await db
    .select({
      prompts: sql<number>`count(*)`,
      views: sql<number>`coalesce(sum(${prompts.viewsCount}), 0)`,
      favorites: sql<number>`coalesce(sum(${prompts.favoritesCount}), 0)`,
      forks: sql<number>`coalesce(sum(${prompts.forksCount}), 0)`
    })
    .from(prompts)
    .where(
      and(
        eq(prompts.userId, user.id),
        eq(prompts.visibility, "PUBLIC"),
        isNull(prompts.deletedAt)
      )
    );

  return res.json({
    user,
    stats: {
      prompts: Number(stats?.prompts ?? 0),
      views: Number(stats?.views ?? 0),
      favorites: Number(stats?.favorites ?? 0),
      forks: Number(stats?.forks ?? 0)
    },
    items: withTags
  });
});

export default router;
