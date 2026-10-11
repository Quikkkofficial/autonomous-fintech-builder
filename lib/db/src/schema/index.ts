import {
  pgTable,
  text,
  serial,
  varchar,
  integer,
  numeric,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 256 }).unique(),
  firebaseUid: varchar("firebase_uid", { length: 128 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  name: varchar("name", { length: 200 }),
  email: varchar("email", { length: 200 }),
  role: varchar("role", { length: 30 }).notNull().default("customer"),
  partnerCode: varchar("partner_code", { length: 30 }),
  kycStatus: varchar("kyc_status", { length: 20 }).notNull().default("pending"),
  panMasked: varchar("pan_masked", { length: 20 }),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const otpsTable = pgTable("otps", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 200 }).notNull(),
  channel: varchar("channel", { length: 10 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull(),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: varchar("user_agent", { length: 300 }),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kycTable = pgTable("kyc", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  fullName: varchar("full_name", { length: 200 }),
  pan: varchar("pan", { length: 20 }),
  aadhaar: varchar("aadhaar", { length: 20 }),
  dob: varchar("dob", { length: 20 }),
  address: text("address"),
  bankAccount: varchar("bank_account", { length: 30 }),
  ifsc: varchar("ifsc", { length: 20 }),
  monthlyIncome: numeric("monthly_income"),
  employmentType: varchar("employment_type", { length: 30 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lendersTable = pgTable("lenders", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  tagline: text("tagline"),
  minRate: numeric("min_rate").notNull(),
  maxRate: numeric("max_rate").notNull(),
  minAmount: numeric("min_amount").notNull(),
  maxAmount: numeric("max_amount").notNull(),
  minTenureMonths: integer("min_tenure_months").notNull(),
  maxTenureMonths: integer("max_tenure_months").notNull(),
  processingFeePct: numeric("processing_fee_pct").notNull(),
  minIncome: numeric("min_income").notNull(),
  minCreditScore: integer("min_credit_score").notNull(),
  approvalHours: integer("approval_hours").notNull(),
  rating: numeric("rating").notNull(),
  supportedTypes: jsonb("supported_types").$type<string[]>().notNull(),
});

export const creditCardsTable = pgTable("credit_cards", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  issuer: varchar("issuer", { length: 100 }).notNull(),
  network: varchar("network", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }),
  annualFee: numeric("annual_fee").notNull(),
  joiningFee: numeric("joining_fee").notNull(),
  rewardsRate: varchar("rewards_rate", { length: 100 }).notNull(),
  minIncome: numeric("min_income").notNull(),
  minCreditScore: integer("min_credit_score").notNull(),
  perks: jsonb("perks").$type<string[]>().notNull(),
  color: varchar("color", { length: 20 }).notNull(),
});

export const loanApplicationsTable = pgTable("loan_applications", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lenderId: varchar("lender_id", { length: 50 }).notNull(),
  lenderName: varchar("lender_name", { length: 200 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: numeric("amount").notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  emi: numeric("emi").notNull(),
  purpose: text("purpose"),
  status: varchar("status", { length: 20 }).notNull().default("submitted"),
  referenceCode: varchar("reference_code", { length: 30 }),
  expectedDisbursalAt: timestamp("expected_disbursal_at", { withTimezone: true }),
  statusHistory: jsonb("status_history").$type<Array<{ status: string; at: string; note: string }>>().notNull(),
  referredByPartnerId: integer("referred_by_partner_id"),
  commissionAmount: numeric("commission_amount"),
  commissionPaid: boolean("commission_paid").notNull().default(false),
  assignedCollectorId: integer("assigned_collector_id"),
  dpd: integer("dpd").notNull().default(0),
  outstandingAmount: numeric("outstanding_amount"),
  recoveredAmount: numeric("recovered_amount").notNull().default("0"),
  customerName: varchar("customer_name", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  umLeadId: varchar("um_lead_id", { length: 100 }),
  umStatus: varchar("um_status", { length: 20 }),
  umPushedAt: timestamp("um_pushed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cardApplicationsTable = pgTable("card_applications", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardId: varchar("card_id", { length: 50 }).notNull(),
  cardName: varchar("card_name", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("submitted"),
  referenceCode: varchar("reference_code", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsTable = pgTable("notifications", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditScoresTable = pgTable("credit_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  bureau: varchar("bureau", { length: 30 }).notNull(),
  band: varchar("band", { length: 20 }).notNull(),
  factors: jsonb("factors").$type<Array<{ label: string; impact: string; detail?: string }>>().notNull(),
  asOf: timestamp("as_of", { withTimezone: true }).defaultNow().notNull(),
});

export const collectionFollowupsTable = pgTable("collection_followups", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id", { length: 50 }).notNull(),
  collectorId: integer("collector_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 20 }).notNull(),
  outcome: varchar("outcome", { length: 30 }).notNull(),
  notes: text("notes"),
  promisedAmount: numeric("promised_amount"),
  promisedDate: varchar("promised_date", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lenderIntegrationsTable = pgTable("lender_integrations", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  apiType: varchar("api_type", { length: 30 }).notNull().default("custom"),
  apiEndpoint: text("api_endpoint"),
  clientId: varchar("client_id", { length: 200 }),
  clientSecret: varchar("client_secret", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("inactive"),
  supportedTypes: jsonb("supported_types").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  totalSent: integer("total_sent").notNull().default(0),
  totalAccepted: integer("total_accepted").notNull().default(0),
  totalRejected: integer("total_rejected").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leadDispatchesTable = pgTable("lead_dispatches", {
  id: serial("id").primaryKey(),
  leadId: varchar("lead_id", { length: 50 }).notNull(),
  integrationId: varchar("integration_id", { length: 50 }).notNull(),
  integrationName: varchar("integration_name", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  externalId: varchar("external_id", { length: 200 }),
  responseMessage: text("response_message"),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const partnerPayoutsTable = pgTable("partner_payouts", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 50 }).notNull(),
  amount: numeric("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------- Bharat UPI (Cashfree PG) ---------- */

export const upiTransactionsTable = pgTable("upi_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 50 }),
  // Our reference (generated) + Cashfree's order id
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  cfOrderId: varchar("cf_order_id", { length: 100 }),
  cfPaymentId: varchar("cf_payment_id", { length: 100 }),
  amount: numeric("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  // emi | processing_fee | platform_fee | other
  purpose: varchar("purpose", { length: 30 }).notNull(),
  // created | pending | success | failed | cancelled | refunded
  status: varchar("status", { length: 20 }).notNull().default("created"),
  // upi_collect | upi_qr | upi_intent | autopay
  method: varchar("method", { length: 20 }),
  upiId: varchar("upi_id", { length: 100 }),
  paymentSessionId: varchar("payment_session_id", { length: 200 }),
  paymentLink: text("payment_link"),
  upiQrString: text("upi_qr_string"),
  // NPCI MDR bucket for post-Oct-2026 accounting (standard_p2m | essential_flat5 | capital_market | exempt)
  mdrBucket: varchar("mdr_bucket", { length: 30 }),
  failureReason: text("failure_reason"),
  webhookPayload: jsonb("webhook_payload").$type<Record<string, unknown>>(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const upiAutopayMandatesTable = pgTable("upi_autopay_mandates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 50 }),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  cfSubscriptionId: varchar("cf_subscription_id", { length: 100 }),
  // Amount per debit (EMI amount)
  amount: numeric("amount").notNull(),
  // Max authorizable amount (allows small variations)
  maxAmount: numeric("max_amount").notNull(),
  // MONTHLY | WEEKLY | FORTNIGHTLY | ON_DEMAND
  frequency: varchar("frequency", { length: 20 }).notNull().default("MONTHLY"),
  totalDebits: integer("total_debits"),
  debitsExecuted: integer("debits_executed").notNull().default(0),
  // created | pending_auth | active | paused | cancelled | expired | failed
  status: varchar("status", { length: 20 }).notNull().default("created"),
  upiId: varchar("upi_id", { length: 100 }),
  authLink: text("auth_link"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  nextDebitAt: timestamp("next_debit_at", { withTimezone: true }),
  lastDebitAt: timestamp("last_debit_at", { withTimezone: true }),
  lastDebitStatus: varchar("last_debit_status", { length: 20 }),
  failureReason: text("failure_reason"),
  webhookPayload: jsonb("webhook_payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const upiPayoutsTable = pgTable("upi_payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 50 }),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  cfTransferId: varchar("cf_transfer_id", { length: 100 }),
  cfBatchId: varchar("cf_batch_id", { length: 100 }),
  amount: numeric("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  // upi | bank_account
  mode: varchar("mode", { length: 20 }).notNull().default("upi"),
  beneficiaryUpiId: varchar("beneficiary_upi_id", { length: 100 }),
  beneficiaryAccount: varchar("beneficiary_account", { length: 30 }),
  beneficiaryIfsc: varchar("beneficiary_ifsc", { length: 20 }),
  beneficiaryName: varchar("beneficiary_name", { length: 200 }),
  // disbursal | commission | refund
  purpose: varchar("purpose", { length: 30 }).notNull(),
  // created | pending | success | failed | reversed
  status: varchar("status", { length: 20 }).notNull().default("created"),
  utr: varchar("utr", { length: 50 }),
  failureReason: text("failure_reason"),
  webhookPayload: jsonb("webhook_payload").$type<Record<string, unknown>>(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
