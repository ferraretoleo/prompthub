DROP TABLE IF EXISTS "user_ai_settings";
DROP TABLE IF EXISTS "prompt_runs";

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "role"
varchar(20) NOT NULL DEFAULT 'USER';

CREATE INDEX IF NOT EXISTS
"users_role_idx"
ON "users" ("role");

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_role_check";

ALTER TABLE "users"
ADD CONSTRAINT "users_role_check"
CHECK ("role" IN ('USER','MODERATOR','ADMIN'));

ALTER TABLE "prompt_reports"
DROP CONSTRAINT IF EXISTS "prompt_reports_status_check";

ALTER TABLE "prompt_reports"
ADD CONSTRAINT "prompt_reports_status_check"
CHECK ("status" IN ('OPEN','REVIEWING','RESOLVED','DISMISSED'));
