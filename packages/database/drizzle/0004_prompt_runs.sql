CREATE TABLE IF NOT EXISTS "prompt_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "prompt_id" uuid NOT NULL REFERENCES "prompts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "model" varchar(100) NOT NULL,
  "rendered_input" text NOT NULL,
  "output_text" text,
  "status" varchar(20) NOT NULL,
  "error_message" varchar(1000),
  "duration_ms" integer,
  "input_tokens" integer,
  "output_tokens" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "prompt_runs_status_check"
    CHECK ("status" IN ('SUCCESS','ERROR'))
);

CREATE INDEX IF NOT EXISTS "prompt_runs_prompt_idx"
ON "prompt_runs" ("prompt_id");

CREATE INDEX IF NOT EXISTS "prompt_runs_user_idx"
ON "prompt_runs" ("user_id");

CREATE INDEX IF NOT EXISTS "prompt_runs_created_idx"
ON "prompt_runs" ("created_at");
