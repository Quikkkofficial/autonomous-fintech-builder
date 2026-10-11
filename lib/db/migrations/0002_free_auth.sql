-- Migration: Replace Clerk auth with free OTP + email verification
-- Date: 2026-10-12
--
-- 1. Add Firebase/email-verification columns to users
-- 2. Rebuild otps table (was unused, old columns dropped) with hashed-code schema
-- 3. Create sessions table for DB-backed cookie sessions

-- 1. users: new columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebase_uid" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_firebase_uid_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_firebase_uid_unique" UNIQUE ("firebase_uid");
  END IF;
END $$;

-- 2. otps: rebuild (old table was unused; drop and recreate with new schema)
DROP TABLE IF EXISTS "otps";
CREATE TABLE "otps" (
  "id" serial PRIMARY KEY,
  "identifier" varchar(200) NOT NULL,
  "channel" varchar(10) NOT NULL,
  "purpose" varchar(20) NOT NULL,
  "code_hash" varchar(64) NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "used_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "otps_identifier_purpose_idx" ON "otps" ("identifier", "purpose");

-- 3. sessions: new table for DB-backed cookie sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "user_agent" varchar(300),
  "ip" varchar(45),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at");
