CREATE TYPE "prompt_visibility" AS ENUM ('PRIVATE', 'PUBLIC');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "username" varchar(40) NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "avatar_url" text,
  "bio" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_username_uq" ON "users" ("username");
CREATE UNIQUE INDEX "users_email_uq" ON "users" ("email");

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "slug" varchar(120) NOT NULL
);
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" ("slug");

CREATE TABLE "prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(180) NOT NULL,
  "slug" varchar(200) NOT NULL,
  "description" varchar(500) NOT NULL,
  "content" text NOT NULL,
  "visibility" "prompt_visibility" NOT NULL DEFAULT 'PRIVATE',
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "current_version" integer NOT NULL DEFAULT 1,
  "forked_from_prompt_id" uuid,
  "views_count" integer NOT NULL DEFAULT 0,
  "forks_count" integer NOT NULL DEFAULT 0,
  "favorites_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX "prompts_user_slug_uq" ON "prompts" ("user_id", "slug");
CREATE INDEX "prompts_user_id_idx" ON "prompts" ("user_id");
CREATE INDEX "prompts_visibility_idx" ON "prompts" ("visibility");
CREATE INDEX "prompts_updated_at_idx" ON "prompts" ("updated_at");
CREATE INDEX "prompts_category_id_idx" ON "prompts" ("category_id");

CREATE TABLE "prompt_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "content" text NOT NULL,
  "change_description" varchar(500),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "prompt_versions_prompt_version_uq" ON "prompt_versions" ("prompt_id", "version");
CREATE INDEX "prompt_versions_prompt_idx" ON "prompt_versions" ("prompt_id");
CREATE INDEX "prompt_versions_user_idx" ON "prompt_versions" ("user_id");

CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(80) NOT NULL,
  "slug" varchar(90) NOT NULL
);
CREATE UNIQUE INDEX "tags_slug_uq" ON "tags" ("slug");

CREATE TABLE "prompt_tags" (
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  PRIMARY KEY ("prompt_id", "tag_id")
);

CREATE TABLE "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "favorites_user_prompt_uq" ON "favorites" ("user_id", "prompt_id");
CREATE INDEX "favorites_user_idx" ON "favorites" ("user_id");
CREATE INDEX "favorites_prompt_idx" ON "favorites" ("prompt_id");

CREATE TABLE "prompt_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "viewer_key" varchar(120),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "prompt_views_prompt_idx" ON "prompt_views" ("prompt_id");

INSERT INTO "categories" ("name", "slug") VALUES
('Desenvolvimento','desenvolvimento'),('Banco de Dados','banco-de-dados'),('SQL Server','sql-server'),
('PostgreSQL','postgresql'),('Progress OpenEdge','progress-openedge'),('Oracle','oracle'),('DevOps','devops'),
('Cloud','cloud'),('IA','ia'),('Marketing','marketing'),('Redes Sociais','redes-sociais'),
('Análise de Dados','analise-de-dados'),('Automação','automacao'),('Escrita','escrita'),('Educação','educacao'),('Outros','outros')
ON CONFLICT DO NOTHING;
