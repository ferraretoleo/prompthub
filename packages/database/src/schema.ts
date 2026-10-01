import {
  pgEnum, pgTable, uuid, varchar, text, timestamp, integer,
  uniqueIndex, index, primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const visibilityEnum = pgEnum("prompt_visibility", ["PRIVATE", "PUBLIC"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 40 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  uniqueIndex("users_username_uq").on(t.username),
  uniqueIndex("users_email_uq").on(t.email)
]);

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull()
}, (t) => [uniqueIndex("categories_slug_uq").on(t.slug)]);

export const prompts = pgTable("prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  content: text("content").notNull(),
  visibility: visibilityEnum("visibility").default("PRIVATE").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  currentVersion: integer("current_version").default(1).notNull(),
  forkedFromPromptId: uuid("forked_from_prompt_id"),
  viewsCount: integer("views_count").default(0).notNull(),
  forksCount: integer("forks_count").default(0).notNull(),
  favoritesCount: integer("favorites_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
}, (t) => [
  uniqueIndex("prompts_user_slug_uq").on(t.userId, t.slug),
  index("prompts_user_id_idx").on(t.userId),
  index("prompts_visibility_idx").on(t.visibility),
  index("prompts_updated_at_idx").on(t.updatedAt),
  index("prompts_category_id_idx").on(t.categoryId)
]);

export const promptVersions = pgTable("prompt_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changeDescription: varchar("change_description", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  uniqueIndex("prompt_versions_prompt_version_uq").on(t.promptId, t.version),
  index("prompt_versions_prompt_idx").on(t.promptId),
  index("prompt_versions_user_idx").on(t.userId)
]);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 90 }).notNull()
}, (t) => [uniqueIndex("tags_slug_uq").on(t.slug)]);

export const promptTags = pgTable("prompt_tags", {
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" })
}, (t) => [primaryKey({ columns: [t.promptId, t.tagId] })]);

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [
  uniqueIndex("favorites_user_prompt_uq").on(t.userId, t.promptId),
  index("favorites_user_idx").on(t.userId),
  index("favorites_prompt_idx").on(t.promptId)
]);

export const promptViews = pgTable("prompt_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  viewerKey: varchar("viewer_key", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [index("prompt_views_prompt_idx").on(t.promptId)]);

export const usersRelations = relations(users, ({ many }) => ({ prompts: many(prompts), favorites: many(favorites) }));
export const promptsRelations = relations(prompts, ({ one, many }) => ({
  owner: one(users, { fields: [prompts.userId], references: [users.id] }),
  category: one(categories, { fields: [prompts.categoryId], references: [categories.id] }),
  versions: many(promptVersions),
  favorites: many(favorites),
  tags: many(promptTags)
}));
