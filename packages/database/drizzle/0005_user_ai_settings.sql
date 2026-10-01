CREATE TABLE IF NOT EXISTS "user_ai_settings" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(30) NOT NULL DEFAULT 'OPENAI',
  "use_own_key" boolean NOT NULL DEFAULT false,
  "encrypted_api_key" text,
  "encryption_iv" varchar(64),
  "encryption_tag" varchar(64),
  "model" varchar(100) NOT NULL DEFAULT 'gpt-5.6-luna',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_ai_settings_provider_check"
    CHECK ("provider" IN ('OPENAI'))
);

ALTER TABLE "prompt_runs"
ADD COLUMN IF NOT EXISTS "execution_mode" varchar(20) NOT NULL DEFAULT 'PLATFORM';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prompt_runs_execution_mode_check'
  ) THEN
    ALTER TABLE "prompt_runs"
    ADD CONSTRAINT "prompt_runs_execution_mode_check"
    CHECK ("execution_mode" IN ('PLATFORM','OWN_KEY'));
  END IF;
END
$$;
