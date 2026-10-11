-- Migration: Bharat UPI integration (Cashfree PG)
-- Date: 2026-10-12
--
-- 1. upi_transactions  — one-time UPI collect / QR / intent payments
-- 2. upi_autopay_mandates — UPI Autopay (e-mandate) subscriptions for recurring EMIs
-- 3. upi_payouts — outbound transfers (loan disbursals, commission payouts, refunds)

-- 1. upi_transactions
CREATE TABLE IF NOT EXISTS "upi_transactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "application_id" varchar(50),
  "reference" varchar(50) NOT NULL UNIQUE,
  "cf_order_id" varchar(100),
  "cf_payment_id" varchar(100),
  "amount" numeric NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'INR',
  "purpose" varchar(30) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'created',
  "method" varchar(20),
  "upi_id" varchar(100),
  "payment_session_id" varchar(200),
  "payment_link" text,
  "upi_qr_string" text,
  "mdr_bucket" varchar(30),
  "failure_reason" text,
  "webhook_payload" jsonb,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "upi_transactions_user_id_idx" ON "upi_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "upi_transactions_status_idx" ON "upi_transactions" ("status");
CREATE INDEX IF NOT EXISTS "upi_transactions_cf_order_id_idx" ON "upi_transactions" ("cf_order_id");
CREATE INDEX IF NOT EXISTS "upi_transactions_application_id_idx" ON "upi_transactions" ("application_id");

-- 2. upi_autopay_mandates
CREATE TABLE IF NOT EXISTS "upi_autopay_mandates" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "application_id" varchar(50),
  "reference" varchar(50) NOT NULL UNIQUE,
  "cf_subscription_id" varchar(100),
  "amount" numeric NOT NULL,
  "max_amount" numeric NOT NULL,
  "frequency" varchar(20) NOT NULL DEFAULT 'MONTHLY',
  "total_debits" integer,
  "debits_executed" integer NOT NULL DEFAULT 0,
  "status" varchar(20) NOT NULL DEFAULT 'created',
  "upi_id" varchar(100),
  "auth_link" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "next_debit_at" timestamp with time zone,
  "last_debit_at" timestamp with time zone,
  "last_debit_status" varchar(20),
  "failure_reason" text,
  "webhook_payload" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "upi_autopay_mandates_user_id_idx" ON "upi_autopay_mandates" ("user_id");
CREATE INDEX IF NOT EXISTS "upi_autopay_mandates_status_idx" ON "upi_autopay_mandates" ("status");
CREATE INDEX IF NOT EXISTS "upi_autopay_mandates_cf_subscription_id_idx" ON "upi_autopay_mandates" ("cf_subscription_id");
CREATE INDEX IF NOT EXISTS "upi_autopay_mandates_application_id_idx" ON "upi_autopay_mandates" ("application_id");

-- 3. upi_payouts
CREATE TABLE IF NOT EXISTS "upi_payouts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "application_id" varchar(50),
  "reference" varchar(50) NOT NULL UNIQUE,
  "cf_transfer_id" varchar(100),
  "cf_batch_id" varchar(100),
  "amount" numeric NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'INR',
  "mode" varchar(20) NOT NULL DEFAULT 'upi',
  "beneficiary_upi_id" varchar(100),
  "beneficiary_account" varchar(30),
  "beneficiary_ifsc" varchar(20),
  "beneficiary_name" varchar(200),
  "purpose" varchar(30) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'created',
  "utr" varchar(50),
  "failure_reason" text,
  "webhook_payload" jsonb,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "upi_payouts_user_id_idx" ON "upi_payouts" ("user_id");
CREATE INDEX IF NOT EXISTS "upi_payouts_status_idx" ON "upi_payouts" ("status");
CREATE INDEX IF NOT EXISTS "upi_payouts_cf_transfer_id_idx" ON "upi_payouts" ("cf_transfer_id");
