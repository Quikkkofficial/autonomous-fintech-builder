/**
 * MongoDB (Mongoose) data layer — replaces Drizzle/PostgreSQL.
 *
 * Design notes:
 * - Numeric auto-increment `id` fields are preserved (via the `counters`
 *   collection) so the rest of the app keeps working with numeric user ids.
 * - Every schema keeps the same field names as the old PostgreSQL tables,
 *   so route code needs only mechanical changes.
 * - `connectMongo()` / `ensureMongo()` are serverless-safe: the connection
 *   is cached across invocations.
 *
 * Env: MONGODB_URI (falls back to DATABASE_URL only if it looks like a
 * mongodb:// or mongodb+srv:// URI, for backwards compatibility).
 */
import mongoose, { Schema, type Document, type Model } from "mongoose";

const DB_NAME = "quikkk";

function resolveMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (uri && /^mongodb(\+srv)?:\/\//.test(uri)) return uri;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && /^mongodb(\+srv)?:\/\//.test(dbUrl)) return dbUrl;
  throw new Error(
    "MONGODB_URI must be set to a mongodb:// or mongodb+srv:// connection string.",
  );
}

let connectPromise: Promise<typeof mongoose> | null = null;

/** Connect once; reuse the cached connection on subsequent calls. */
export function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(resolveMongoUri(), { dbName: DB_NAME })
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }
  return connectPromise;
}

/** Await this at the top of any handler that touches MongoDB. */
export async function ensureMongo(): Promise<void> {
  await connectMongo();
}

/* ------------------------------------------------------------------ */
/* Auto-increment counters (replaces PostgreSQL `serial` columns).     */
/* ------------------------------------------------------------------ */

const counterSchema = new Schema(
  { _id: { type: String, required: true }, seq: { type: Number, default: 0 } },
  { collection: "counters" },
);
const Counter: Model<{ _id: string; seq: number }> =
  mongoose.models.Counter || mongoose.model("_Counter", counterSchema);

/** Atomically get the next integer id for a named sequence. */
export async function nextId(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  ).lean();
  return doc!.seq;
}

/* ------------------------------------------------------------------ */
/* Shared field helpers                                                */
/* ------------------------------------------------------------------ */

const dateNow = { type: Date, default: () => new Date() } as const;

/* ------------------------------------------------------------------ */
/* users                                                               */
/* ------------------------------------------------------------------ */

export interface UserDoc extends Document {
  id: number;
  clerkId?: string | null;
  firebaseUid?: string | null;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  role: string;
  partnerCode?: string | null;
  kycStatus: string;
  panMasked?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    id: { type: Number, unique: true, required: true, index: true },
    clerkId: { type: String, default: null, index: true, sparse: true, unique: true },
    firebaseUid: { type: String, default: null, index: true, sparse: true, unique: true },
    phone: { type: String, default: null, index: true, sparse: true, unique: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
    role: { type: String, default: "customer", required: true },
    partnerCode: { type: String, default: null },
    kycStatus: { type: String, default: "pending", required: true },
    panMasked: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    createdAt: dateNow,
  },
  { collection: "users" },
);

/* ------------------------------------------------------------------ */
/* otps                                                                */
/* ------------------------------------------------------------------ */

export interface OtpDoc extends Document {
  id: number;
  identifier: string;
  channel: string;
  purpose: string;
  codeHash: string;
  attempts: number;
  usedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<OtpDoc>(
  {
    id: { type: Number, unique: true, required: true, index: true },
    identifier: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    purpose: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, required: true },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    createdAt: dateNow,
  },
  { collection: "otps" },
);

/* ------------------------------------------------------------------ */
/* sessions                                                            */
/* ------------------------------------------------------------------ */

export interface SessionDoc extends Document {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: Date;
}

const sessionSchema = new Schema<SessionDoc>(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
    createdAt: dateNow,
  },
  { collection: "sessions" },
);

/* ------------------------------------------------------------------ */
/* kyc                                                                 */
/* ------------------------------------------------------------------ */

const kycSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    status: { type: String, default: "pending", required: true },
    fullName: { type: String, default: null },
    pan: { type: String, default: null },
    aadhaar: { type: String, default: null },
    dob: { type: String, default: null },
    address: { type: String, default: null },
    bankAccount: { type: String, default: null },
    ifsc: { type: String, default: null },
    monthlyIncome: { type: Number, default: null },
    employmentType: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    createdAt: dateNow,
  },
  { collection: "kyc" },
);

/* ------------------------------------------------------------------ */
/* lenders                                                             */
/* ------------------------------------------------------------------ */

const lenderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    tagline: { type: String, default: null },
    minRate: { type: Number, required: true },
    maxRate: { type: Number, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    minTenureMonths: { type: Number, required: true },
    maxTenureMonths: { type: Number, required: true },
    processingFeePct: { type: Number, required: true },
    minIncome: { type: Number, required: true },
    minCreditScore: { type: Number, required: true },
    approvalHours: { type: Number, required: true },
    rating: { type: Number, required: true },
    supportedTypes: { type: [String], required: true },
  },
  { collection: "lenders" },
);

/* ------------------------------------------------------------------ */
/* credit_cards                                                        */
/* ------------------------------------------------------------------ */

const creditCardSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    network: { type: String, required: true },
    category: { type: String, default: null },
    annualFee: { type: Number, required: true },
    joiningFee: { type: Number, required: true },
    rewardsRate: { type: String, required: true },
    minIncome: { type: Number, required: true },
    minCreditScore: { type: Number, required: true },
    perks: { type: [String], required: true },
    color: { type: String, required: true },
  },
  { collection: "credit_cards" },
);

/* ------------------------------------------------------------------ */
/* loan_applications                                                   */
/* ------------------------------------------------------------------ */

const statusHistoryEntry = new Schema(
  { status: String, at: String, note: String },
  { _id: false },
);

const loanApplicationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    lenderId: { type: String, required: true },
    lenderName: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    emi: { type: Number, required: true },
    purpose: { type: String, default: null },
    status: { type: String, default: "submitted", required: true },
    referenceCode: { type: String, default: null },
    expectedDisbursalAt: { type: Date, default: null },
    statusHistory: { type: [statusHistoryEntry], required: true },
    referredByPartnerId: { type: Number, default: null },
    commissionAmount: { type: Number, default: null },
    commissionPaid: { type: Boolean, default: false, required: true },
    assignedCollectorId: { type: Number, default: null },
    dpd: { type: Number, default: 0, required: true },
    outstandingAmount: { type: Number, default: null },
    recoveredAmount: { type: Number, default: 0, required: true },
    customerName: { type: String, default: null },
    customerPhone: { type: String, default: null },
    umLeadId: { type: String, default: null },
    umStatus: { type: String, default: null },
    umPushedAt: { type: Date, default: null },
    createdAt: dateNow,
  },
  { collection: "loan_applications" },
);

/* ------------------------------------------------------------------ */
/* card_applications                                                   */
/* ------------------------------------------------------------------ */

const cardApplicationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    cardId: { type: String, required: true },
    cardName: { type: String, required: true },
    status: { type: String, default: "submitted", required: true },
    referenceCode: { type: String, default: null },
    createdAt: dateNow,
  },
  { collection: "card_applications" },
);

/* ------------------------------------------------------------------ */
/* notifications                                                       */
/* ------------------------------------------------------------------ */

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    channel: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, required: true },
    createdAt: dateNow,
  },
  { collection: "notifications" },
);

/* ------------------------------------------------------------------ */
/* credit_scores                                                       */
/* ------------------------------------------------------------------ */

const creditScoreFactor = new Schema(
  { label: String, impact: String, detail: String },
  { _id: false },
);

const creditScoreSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    score: { type: Number, required: true },
    bureau: { type: String, required: true },
    band: { type: String, required: true },
    factors: { type: [creditScoreFactor], required: true },
    asOf: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "credit_scores" },
);

/* ------------------------------------------------------------------ */
/* collection_followups                                                */
/* ------------------------------------------------------------------ */

const collectionFollowupSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    collectorId: { type: Number, required: true, index: true },
    channel: { type: String, required: true },
    outcome: { type: String, required: true },
    notes: { type: String, default: null },
    promisedAmount: { type: Number, default: null },
    promisedDate: { type: String, default: null },
    createdAt: dateNow,
  },
  { collection: "collection_followups" },
);

/* ------------------------------------------------------------------ */
/* lender_integrations                                                 */
/* ------------------------------------------------------------------ */

const lenderIntegrationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    apiType: { type: String, default: "custom", required: true },
    apiEndpoint: { type: String, default: null },
    clientId: { type: String, default: null },
    clientSecret: { type: String, default: null },
    status: { type: String, default: "inactive", required: true },
    supportedTypes: { type: [String], default: [], required: true },
    notes: { type: String, default: null },
    totalSent: { type: Number, default: 0, required: true },
    totalAccepted: { type: Number, default: 0, required: true },
    totalRejected: { type: Number, default: 0, required: true },
    createdAt: dateNow,
  },
  { collection: "lender_integrations" },
);

/* ------------------------------------------------------------------ */
/* lead_dispatches                                                     */
/* ------------------------------------------------------------------ */

const leadDispatchSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    leadId: { type: String, required: true },
    integrationId: { type: String, required: true },
    integrationName: { type: String, required: true },
    status: { type: String, default: "pending", required: true },
    externalId: { type: String, default: null },
    responseMessage: { type: String, default: null },
    dispatchedAt: { type: Date, default: () => new Date(), required: true },
    updatedAt: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "lead_dispatches" },
);

/* ------------------------------------------------------------------ */
/* partner_payouts                                                     */
/* ------------------------------------------------------------------ */

const partnerPayoutSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    partnerId: { type: Number, required: true, index: true },
    applicationId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending", required: true },
    paidAt: { type: Date, default: null },
    createdAt: dateNow,
  },
  { collection: "partner_payouts" },
);

/* ------------------------------------------------------------------ */
/* upi_transactions / upi_autopay_mandates / upi_payouts                */
/* ------------------------------------------------------------------ */

const upiTransactionSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    applicationId: { type: String, default: null },
    reference: { type: String, required: true, unique: true, index: true },
    cfOrderId: { type: String, default: null },
    cfPaymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR", required: true },
    purpose: { type: String, required: true },
    status: { type: String, default: "created", required: true },
    method: { type: String, default: null },
    upiId: { type: String, default: null },
    paymentSessionId: { type: String, default: null },
    paymentLink: { type: String, default: null },
    upiQrString: { type: String, default: null },
    mdrBucket: { type: String, default: null },
    failureReason: { type: String, default: null },
    webhookPayload: { type: Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null },
    createdAt: dateNow,
    updatedAt: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "upi_transactions" },
);

const upiAutopayMandateSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    applicationId: { type: String, default: null },
    reference: { type: String, required: true, unique: true, index: true },
    cfSubscriptionId: { type: String, default: null },
    amount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    frequency: { type: String, default: "MONTHLY", required: true },
    totalDebits: { type: Number, default: null },
    debitsExecuted: { type: Number, default: 0, required: true },
    status: { type: String, default: "created", required: true },
    upiId: { type: String, default: null },
    authLink: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    nextDebitAt: { type: Date, default: null },
    lastDebitAt: { type: Date, default: null },
    lastDebitStatus: { type: String, default: null },
    failureReason: { type: String, default: null },
    webhookPayload: { type: Schema.Types.Mixed, default: null },
    createdAt: dateNow,
    updatedAt: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "upi_autopay_mandates" },
);

const upiPayoutSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    applicationId: { type: String, default: null },
    reference: { type: String, required: true, unique: true, index: true },
    cfTransferId: { type: String, default: null },
    cfBatchId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR", required: true },
    mode: { type: String, default: "upi", required: true },
    beneficiaryUpiId: { type: String, default: null },
    beneficiaryAccount: { type: String, default: null },
    beneficiaryIfsc: { type: String, default: null },
    beneficiaryName: { type: String, default: null },
    purpose: { type: String, required: true },
    status: { type: String, default: "created", required: true },
    utr: { type: String, default: null },
    failureReason: { type: String, default: null },
    webhookPayload: { type: Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: null },
    createdAt: dateNow,
    updatedAt: { type: Date, default: () => new Date(), required: true },
  },
  { collection: "upi_payouts" },
);

/* ------------------------------------------------------------------ */
/* Model registration (guarded for serverless hot-reload)              */
/* ------------------------------------------------------------------ */

function getModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const User = getModel<UserDoc>("User", userSchema);
export const Otp = getModel<OtpDoc>("Otp", otpSchema);
export const Session = getModel<SessionDoc>("Session", sessionSchema);
export const Kyc = getModel("Kyc", kycSchema);
export const Lender = getModel("Lender", lenderSchema);
export const CreditCard = getModel("CreditCard", creditCardSchema);
export const LoanApplication = getModel("LoanApplication", loanApplicationSchema);
export const CardApplication = getModel("CardApplication", cardApplicationSchema);
export const Notification = getModel("Notification", notificationSchema);
export const CreditScore = getModel("CreditScore", creditScoreSchema);
export const CollectionFollowup = getModel(
  "CollectionFollowup",
  collectionFollowupSchema,
);
export const LenderIntegration = getModel(
  "LenderIntegration",
  lenderIntegrationSchema,
);
export const LeadDispatch = getModel("LeadDispatch", leadDispatchSchema);
export const PartnerPayout = getModel("PartnerPayout", partnerPayoutSchema);
export const UpiTransaction = getModel("UpiTransaction", upiTransactionSchema);
export const UpiAutopayMandate = getModel(
  "UpiAutopayMandate",
  upiAutopayMandateSchema,
);
export const UpiPayout = getModel("UpiPayout", upiPayoutSchema);
