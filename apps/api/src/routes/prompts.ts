import { Router } from "express";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  or,
  sql
} from "drizzle-orm";
import { z } from "zod";
import {
  categories,
  createDb,
  favorites,
  promptTags,
  promptVersions,
  prompts,
  tags,
  users
} from "@prompthub/database";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { slugify } from "../lib/utils.js";

const router = Router();
const db = createDb();

function getRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value;

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string" && first.trim()) return first;
  }

  return null;
}

function normalizeTagNames(values: string[] | undefined) {
  const unique = new Map<string, string>();

  for (const raw of values ?? []) {
    const name = raw.trim().replace(/^#/, "").slice(0, 80);
    const slug = slugify(name);

    if (name && slug) {
      unique.set(slug, name);
    }
  }

  return Array.from(unique.entries())
    .slice(0, 8)
    .map(([slug, name]) => ({ slug, name }));
}

async function syncPromptTags(promptId: string, values: string[] | undefined) {
  const normalized = normalizeTagNames(values);

  await db
    .delete(promptTags)
    .where(eq(promptTags.promptId, promptId));

  if (!normalized.length) {
    return [];
  }

  await db
    .insert(tags)
    .values(normalized)
    .onConflictDoNothing({ target: tags.slug });

  const existing = await db
    .select()
    .from(tags)
    .where(inArray(tags.slug, normalized.map((item) => item.slug)));

  if (existing.length) {
    await db
      .insert(promptTags)
      .values(existing.map((tag) => ({
        promptId,
        tagId: tag.id
      })))
      .onConflictDoNothing();
  }

  return existing.map((tag) => tag.name);
}

async function getPromptTagNames(promptId: string) {
  const rows = await db
    .select({ name: tags.name })
    .from(promptTags)
    .innerJoin(tags, eq(promptTags.tagId, tags.id))
    .where(eq(promptTags.promptId, promptId));

  return rows.map((row) => row.name);
}

const createSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().min(3).max(500),
  content: z.string().min(1),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(8).optional()
});

router.get("/", requireAuth, async (req, res) => {
  const scope = String(req.query.scope ?? "all");
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  const offset = (page - 1) * limit;
  const ownerId = req.authUser!.id;

  if (scope === "favorites") {
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
        avatarUrl: users.avatarUrl
      })
      .from(favorites)
      .innerJoin(prompts, eq(favorites.promptId, prompts.id))
      .innerJoin(users, eq(prompts.userId, users.id))
      .where(
        and(
          eq(favorites.userId, ownerId),
          eq(prompts.visibility, "PUBLIC"),
          isNull(prompts.deletedAt)
        )
      )
      .orderBy(desc(favorites.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ items, page, limit });
  }

  let access = or(
    eq(prompts.userId, ownerId),
    eq(prompts.visibility, "PUBLIC")
  );

  if (scope === "mine") access = eq(prompts.userId, ownerId);
  if (scope === "public") access = eq(prompts.visibility, "PUBLIC");

  if (scope === "private") {
    access = and(
      eq(prompts.userId, ownerId),
      eq(prompts.visibility, "PRIVATE")
    );
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
      avatarUrl: users.avatarUrl
    })
    .from(prompts)
    .innerJoin(users, eq(prompts.userId, users.id))
    .where(and(isNull(prompts.deletedAt), access))
    .orderBy(desc(prompts.updatedAt))
    .limit(limit)
    .offset(offset);

  return res.json({ items, page, limit });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      details: parsed.error.flatten()
    });
  }

  const userId = req.authUser!.id;
  const slug = slugify(parsed.data.slug || parsed.data.title);

  if (!slug) {
    return res.status(400).json({ error: "Slug inválido" });
  }

  try {
    const [prompt] = await db
      .insert(prompts)
      .values({
        userId,
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        content: parsed.data.content,
        visibility: parsed.data.visibility,
        categoryId: parsed.data.categoryId ?? null
      })
      .returning();

    if (!prompt) {
      return res.status(500).json({ error: "Falha ao criar prompt" });
    }

    await db.insert(promptVersions).values({
      promptId: prompt.id,
      userId,
      version: 1,
      content: prompt.content,
      changeDescription: "Versão inicial"
    });

    await syncPromptTags(prompt.id, parsed.data.tags);

    return res.status(201).json({ prompt });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        error: "Você já possui um prompt com esse slug"
      });
    }

    throw error;
  }
});

router.get("/public/:username/:slug", optionalAuth, async (req, res) => {
  const username = getRouteParam(req.params.username);
  const slug = getRouteParam(req.params.slug);

  if (!username || !slug) {
    return res.status(400).json({ error: "Usuário ou slug inválido" });
  }

  const [prompt] = await db
    .select({
      id: prompts.id,
      userId: prompts.userId,
      title: prompts.title,
      slug: prompts.slug,
      description: prompts.description,
      content: prompts.content,
      visibility: prompts.visibility,
      currentVersion: prompts.currentVersion,
      updatedAt: prompts.updatedAt,
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
        eq(users.username, username),
        eq(prompts.slug, slug),
        eq(prompts.visibility, "PUBLIC"),
        isNull(prompts.deletedAt)
      )
    )
    .limit(1);

  if (!prompt) {
    return res.status(404).json({ error: "Prompt público não encontrado" });
  }

  await db
    .update(prompts)
    .set({ viewsCount: sql`${prompts.viewsCount} + 1` })
    .where(eq(prompts.id, prompt.id));

  const tagNames = await getPromptTagNames(prompt.id);

  return res.json({
    prompt: {
      ...prompt,
      tags: tagNames,
      viewsCount: prompt.viewsCount + 1
    }
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const userId = req.authUser!.id;

  const [prompt] = await db
    .select({
      id: prompts.id,
      userId: prompts.userId,
      title: prompts.title,
      slug: prompts.slug,
      description: prompts.description,
      content: prompts.content,
      visibility: prompts.visibility,
      categoryId: prompts.categoryId,
      currentVersion: prompts.currentVersion,
      forkedFromPromptId: prompts.forkedFromPromptId,
      viewsCount: prompts.viewsCount,
      forksCount: prompts.forksCount,
      favoritesCount: prompts.favoritesCount,
      createdAt: prompts.createdAt,
      updatedAt: prompts.updatedAt,
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
        eq(prompts.id, id),
        isNull(prompts.deletedAt),
        or(
          eq(prompts.userId, userId),
          eq(prompts.visibility, "PUBLIC")
        )
      )
    )
    .limit(1);

  if (!prompt) {
    return res.status(404).json({ error: "Prompt não encontrado" });
  }

  let isFavorite = false;

  if (prompt.visibility === "PUBLIC") {
    const [favorite] = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.promptId, prompt.id)
        )
      )
      .limit(1);

    isFavorite = Boolean(favorite);
  }

  const tagNames = await getPromptTagNames(prompt.id);

  return res.json({
    prompt: {
      ...prompt,
      tags: tagNames,
      isOwner: prompt.userId === userId,
      isFavorite
    }
  });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const parsed = createSchema
    .partial()
    .extend({
      changeDescription: z.string().trim().max(500).optional()
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      details: parsed.error.flatten()
    });
  }

  const userId = req.authUser!.id;

  const [current] = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        eq(prompts.userId, userId),
        isNull(prompts.deletedAt)
      )
    )
    .limit(1);

  if (!current) {
    return res.status(404).json({ error: "Prompt não encontrado" });
  }

  const nextContent = parsed.data.content ?? current.content;
  const contentChanged = nextContent !== current.content;
  const nextVersion = contentChanged
    ? current.currentVersion + 1
    : current.currentVersion;

  const [updated] = await db
    .update(prompts)
    .set({
      title: parsed.data.title ?? current.title,
      slug: parsed.data.slug ? slugify(parsed.data.slug) : current.slug,
      description: parsed.data.description ?? current.description,
      content: nextContent,
      visibility: parsed.data.visibility ?? current.visibility,
      categoryId:
        parsed.data.categoryId === undefined
          ? current.categoryId
          : parsed.data.categoryId,
      currentVersion: nextVersion,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(prompts.id, current.id),
        eq(prompts.userId, userId)
      )
    )
    .returning();

  if (contentChanged) {
    await db.insert(promptVersions).values({
      promptId: current.id,
      userId,
      version: nextVersion,
      content: nextContent,
      changeDescription:
        parsed.data.changeDescription || "Conteúdo atualizado"
    });
  }

  if (parsed.data.tags !== undefined) {
    await syncPromptTags(current.id, parsed.data.tags);
  }

  return res.json({ prompt: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const [deleted] = await db
    .update(prompts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(prompts.id, id),
        eq(prompts.userId, req.authUser!.id),
        isNull(prompts.deletedAt)
      )
    )
    .returning({ id: prompts.id });

  if (!deleted) {
    return res.status(404).json({ error: "Prompt não encontrado" });
  }

  return res.status(204).send();
});

router.get("/:id/versions", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const [allowed] = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        isNull(prompts.deletedAt),
        or(
          eq(prompts.userId, req.authUser!.id),
          eq(prompts.visibility, "PUBLIC")
        )
      )
    )
    .limit(1);

  if (!allowed) {
    return res.status(404).json({ error: "Prompt não encontrado" });
  }

  const items = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, id))
    .orderBy(desc(promptVersions.version));

  return res.json({ items });
});

router.post("/:id/favorite", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const userId = req.authUser!.id;

  const [allowed] = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        isNull(prompts.deletedAt),
        eq(prompts.visibility, "PUBLIC")
      )
    )
    .limit(1);

  if (!allowed) {
    return res.status(404).json({ error: "Prompt público não encontrado" });
  }

  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.promptId, id)
      )
    )
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));

    await db
      .update(prompts)
      .set({
        favoritesCount: sql`GREATEST(${prompts.favoritesCount} - 1, 0)`
      })
      .where(eq(prompts.id, id));

    return res.json({ favorite: false });
  }

  await db.insert(favorites).values({ userId, promptId: id });

  await db
    .update(prompts)
    .set({ favoritesCount: sql`${prompts.favoritesCount} + 1` })
    .where(eq(prompts.id, id));

  return res.json({ favorite: true });
});

router.post("/:id/fork", requireAuth, async (req, res) => {
  const id = getRouteParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID do prompt inválido" });
  }

  const userId = req.authUser!.id;

  const [source] = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.id, id),
        eq(prompts.visibility, "PUBLIC"),
        isNull(prompts.deletedAt)
      )
    )
    .limit(1);

  if (!source) {
    return res.status(404).json({ error: "Prompt público não encontrado" });
  }

  const baseSlug = slugify(source.slug + "-fork");
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const [fork] = await db
    .insert(prompts)
    .values({
      userId,
      title: source.title,
      slug,
      description: source.description,
      content: source.content,
      visibility: "PRIVATE",
      categoryId: source.categoryId,
      forkedFromPromptId: source.id
    })
    .returning();

  if (!fork) {
    return res.status(500).json({ error: "Falha ao criar fork" });
  }

  await db.insert(promptVersions).values({
    promptId: fork.id,
    userId,
    version: 1,
    content: fork.content,
    changeDescription: "Fork criado"
  });

  const sourceTags = await getPromptTagNames(source.id);
  await syncPromptTags(fork.id, sourceTags);

  await db
    .update(prompts)
    .set({ forksCount: sql`${prompts.forksCount} + 1` })
    .where(eq(prompts.id, source.id));

  return res.status(201).json({ prompt: fork });
});

export default router;
