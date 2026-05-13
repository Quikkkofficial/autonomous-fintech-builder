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
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }),
  email: varchar("email", { length: 200 }),
  role: varchar("role", { length: 30 }).notNull().default("customer"),
  partnerCode: varchar("partner_code", { length: 30 }),
  kycStatus: varchar("kyc_status", { length: 20 }).notNull().default("pending"),
  panMasked: varchar("pan_masked", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const otpsTable = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
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

export const partnerPayoutsTable = pgTable("partner_payouts", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 50 }).notNull(),
  amount: numeric("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
