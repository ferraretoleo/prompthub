ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "role" varchar(20) NOT NULL DEFAULT 'USER';

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_role_check"
    CHECK ("role" IN ('MASTER', 'USER'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "users_role_idx"
ON "users" ("role");

CREATE INDEX IF NOT EXISTS "users_is_active_idx"
ON "users" ("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "users_single_master_uq"
ON "users" ("role")
WHERE "role" = 'MASTER';
