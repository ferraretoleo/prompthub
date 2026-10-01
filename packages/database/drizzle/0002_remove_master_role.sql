DROP INDEX IF EXISTS "users_single_master_uq";
DROP INDEX IF EXISTS "users_role_idx";

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_role_check";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "role";
