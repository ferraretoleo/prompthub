ALTER TABLE "prompt_runs"
DROP CONSTRAINT IF EXISTS "prompt_runs_status_check";

ALTER TABLE "prompt_runs"
ADD CONSTRAINT "prompt_runs_status_check"
CHECK ("status" IN ('PENDING','SUCCESS','ERROR'));
