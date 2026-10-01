CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_hash_uq"
ON "password_reset_tokens" ("token_hash");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx"
ON "password_reset_tokens" ("user_id");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_idx"
ON "password_reset_tokens" ("expires_at");


CREATE TABLE IF NOT EXISTS "prompt_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "reported_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "reason" varchar(40) NOT NULL,
  "description" varchar(1000),
  "status" varchar(20) NOT NULL DEFAULT 'OPEN',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "prompt_reports_reason_check"
    CHECK ("reason" IN ('SPAM','INAPPROPRIATE','MISLEADING','COPYRIGHT','OTHER')),
  CONSTRAINT "prompt_reports_status_check"
    CHECK ("status" IN ('OPEN','REVIEWED','DISMISSED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "prompt_reports_user_prompt_uq"
ON "prompt_reports" ("reported_by_user_id", "prompt_id");

CREATE INDEX IF NOT EXISTS "prompt_reports_prompt_idx"
ON "prompt_reports" ("prompt_id");

CREATE INDEX IF NOT EXISTS "prompt_reports_status_idx"
ON "prompt_reports" ("status");


CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(60) NOT NULL,
  "entity_type" varchar(60),
  "entity_id" varchar(120),
  "ip_address" varchar(64),
  "user_agent" text,
  "details" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "audit_logs_user_idx"
ON "audit_logs" ("user_id");

CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"
ON "audit_logs" ("action");

CREATE INDEX IF NOT EXISTS "audit_logs_created_idx"
ON "audit_logs" ("created_at");
