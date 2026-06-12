import {
  db,
  lendersTable,
  creditCardsTable,
  usersTable,
  loanApplicationsTable,
  partnerPayoutsTable,
  collectionFollowupsTable,
  lenderIntegrationsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { logger } from "./logger";
import { calcEmi, genId } from "./utils";

const LENDERS = [
  {
    id: "hdfc",
    name: "HDFC Bank",
    type: "bank",
    tagline: "India's most trusted private bank",
    minRate: "10.5",
    maxRate: "16.5",
    minAmount: "50000",
    maxAmount: "4000000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "1.5",
    minIncome: "25000",
    minCreditScore: 720,
    approvalHours: 24,
    rating: "4.6",
    supportedTypes: ["personal", "home", "auto", "business"],
  },
  {
    id: "icici",
    name: "ICICI Bank",
    type: "bank",
    tagline: "Khayaal aapka",
    minRate: "10.75",
    maxRate: "17.5",
    minAmount: "50000",
    maxAmount: "5000000",
    minTenureMonths: 12,
    maxTenureMonths: 72,
    processingFeePct: "1.75",
    minIncome: "25000",
    minCreditScore: 700,
    approvalHours: 24,
    rating: "4.5",
    supportedTypes: ["personal", "home", "auto", "business", "education"],
  },
  {
    id: "axis",
    name: "Axis Bank",
    type: "bank",
    tagline: "Badhti ka naam zindagi",
    minRate: "10.99",
    maxRate: "18",
    minAmount: "50000",
    maxAmount: "4000000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "2",
    minIncome: "20000",
    minCreditScore: 690,
    approvalHours: 36,
    rating: "4.4",
    supportedTypes: ["personal", "home", "auto"],
  },
  {
    id: "sbi",
    name: "State Bank of India",
    type: "bank",
    tagline: "The banker to every Indian",
    minRate: "9.6",
    maxRate: "14.5",
    minAmount: "100000",
    maxAmount: "5000000",
    minTenureMonths: 12,
    maxTenureMonths: 84,
    processingFeePct: "1",
    minIncome: "15000",
    minCreditScore: 680,
    approvalHours: 48,
    rating: "4.3",
    supportedTypes: ["personal", "home", "auto", "education"],
  },
  {
    id: "kotak",
    name: "Kotak Mahindra Bank",
    type: "bank",
    tagline: "Lets make money simple",
    minRate: "10.99",
    maxRate: "20",
    minAmount: "50000",
    maxAmount: "3500000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "2.5",
    minIncome: "25000",
    minCreditScore: 700,
    approvalHours: 24,
    rating: "4.4",
    supportedTypes: ["personal", "home", "auto", "business"],
  },
  {
    id: "bajaj",
    name: "Bajaj Finserv",
    type: "nbfc",
    tagline: "Pre-approved loans in 30 minutes",
    minRate: "11.99",
    maxRate: "24",
    minAmount: "30000",
    maxAmount: "2500000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "3.5",
    minIncome: "20000",
    minCreditScore: 685,
    approvalHours: 6,
    rating: "4.5",
    supportedTypes: ["personal", "auto", "business"],
  },
  {
    id: "tatacap",
    name: "Tata Capital",
    type: "nbfc",
    tagline: "Count on us",
    minRate: "10.99",
    maxRate: "21",
    minAmount: "75000",
    maxAmount: "3500000",
    minTenureMonths: 12,
    maxTenureMonths: 72,
    processingFeePct: "2.75",
    minIncome: "22000",
    minCreditScore: 700,
    approvalHours: 24,
    rating: "4.3",
    supportedTypes: ["personal", "home", "business"],
  },
  {
    id: "mahindra",
    name: "Mahindra Finance",
    type: "nbfc",
    tagline: "Rural and semi-urban specialist",
    minRate: "12.5",
    maxRate: "26",
    minAmount: "50000",
    maxAmount: "1500000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "3",
    minIncome: "15000",
    minCreditScore: 650,
    approvalHours: 12,
    rating: "4.1",
    supportedTypes: ["personal", "auto", "business"],
  },
  {
    id: "lendingkart",
    name: "Lendingkart",
    type: "nbfc",
    tagline: "Working capital for SMEs",
    minRate: "15",
    maxRate: "27",
    minAmount: "50000",
    maxAmount: "2000000",
    minTenureMonths: 6,
    maxTenureMonths: 36,
    processingFeePct: "2.5",
    minIncome: "30000",
    minCreditScore: 660,
    approvalHours: 8,
    rating: "4.2",
    supportedTypes: ["business", "personal"],
  },
  {
    id: "iifl",
    name: "IIFL Finance",
    type: "nbfc",
    tagline: "Growing India responsibly",
    minRate: "11.5",
    maxRate: "23",
    minAmount: "30000",
    maxAmount: "1800000",
    minTenureMonths: 6,
    maxTenureMonths: 60,
    processingFeePct: "2.5",
    minIncome: "18000",
    minCreditScore: 670,
    approvalHours: 12,
    rating: "4.2",
    supportedTypes: ["personal", "home", "business"],
  },
  {
    id: "lic-housing",
    name: "LIC Housing Finance",
    type: "nbfc",
    tagline: "Home loan specialist",
    minRate: "8.5",
    maxRate: "11.5",
    minAmount: "500000",
    maxAmount: "5000000",
    minTenureMonths: 60,
    maxTenureMonths: 360,
    processingFeePct: "0.5",
    minIncome: "30000",
    minCreditScore: 720,
    approvalHours: 72,
    rating: "4.4",
    supportedTypes: ["home"],
  },
  {
    id: "credit-saison",
    name: "Credit Saison",
    type: "nbfc",
    tagline: "Personal loans, instantly",
    minRate: "13.99",
    maxRate: "29",
    minAmount: "25000",
    maxAmount: "1500000",
    minTenureMonths: 6,
    maxTenureMonths: 48,
    processingFeePct: "3.5",
    minIncome: "18000",
    minCreditScore: 660,
    approvalHours: 4,
    rating: "4.0",
    supportedTypes: ["personal"],
  },
  {
    id: "muthoot",
    name: "Muthoot Finance",
    type: "nbfc",
    tagline: "India's No. 1 gold loan company",
    minRate: "7.0",
    maxRate: "12.0",
    minAmount: "10000",
    maxAmount: "5000000",
    minTenureMonths: 3,
    maxTenureMonths: 36,
    processingFeePct: "0.5",
    minIncome: "0",
    minCreditScore: 0,
    approvalHours: 1,
    rating: "4.5",
    supportedTypes: ["gold"],
  },
  {
    id: "manappuram",
    name: "Manappuram Finance",
    type: "nbfc",
    tagline: "Trusted gold loan specialist",
    minRate: "7.5",
    maxRate: "13.0",
    minAmount: "10000",
    maxAmount: "3000000",
    minTenureMonths: 3,
    maxTenureMonths: 36,
    processingFeePct: "0.5",
    minIncome: "0",
    minCreditScore: 0,
    approvalHours: 1,
    rating: "4.3",
    supportedTypes: ["gold"],
  },
  {
    id: "hdfc-securities",
    name: "HDFC Securities",
    type: "nbfc",
    tagline: "Margin funding & securities lending",
    minRate: "9.0",
    maxRate: "11.5",
    minAmount: "50000",
    maxAmount: "50000000",
    minTenureMonths: 6,
    maxTenureMonths: 36,
    processingFeePct: "0.25",
    minIncome: "30000",
    minCreditScore: 700,
    approvalHours: 4,
    rating: "4.4",
    supportedTypes: ["mutual_fund", "fd"],
  },
  {
    id: "bajaj-fd",
    name: "Bajaj Finance FD & Loans",
    type: "nbfc",
    tagline: "Up to 85% loan on your FD",
    minRate: "1.0",
    maxRate: "2.0",
    minAmount: "10000",
    maxAmount: "100000000",
    minTenureMonths: 1,
    maxTenureMonths: 60,
    processingFeePct: "0.0",
    minIncome: "0",
    minCreditScore: 0,
    approvalHours: 2,
    rating: "4.6",
    supportedTypes: ["fd"],
  },
  {
    id: "lic-policy-loan",
    name: "LIC Policy Loan",
    type: "nbfc",
    tagline: "Borrow against your LIC policy",
    minRate: "9.0",
    maxRate: "10.0",
    minAmount: "10000",
    maxAmount: "5000000",
    minTenureMonths: 6,
    maxTenureMonths: 60,
    processingFeePct: "0.0",
    minIncome: "0",
    minCreditScore: 0,
    approvalHours: 24,
    rating: "4.5",
    supportedTypes: ["insurance"],
  },
  {
    id: "axis-insurance-loan",
    name: "Axis Bank Insurance Loan",
    type: "bank",
    tagline: "Loan against ULIP & traditional plans",
    minRate: "10.5",
    maxRate: "13.0",
    minAmount: "50000",
    maxAmount: "5000000",
    minTenureMonths: 12,
    maxTenureMonths: 60,
    processingFeePct: "1.0",
    minIncome: "20000",
    minCreditScore: 650,
    approvalHours: 48,
    rating: "4.2",
    supportedTypes: ["insurance", "fd", "mutual_fund"],
  },
] as const;

const CARDS = [
  {
    id: "hdfc-millennia",
    name: "HDFC Millennia",
    issuer: "HDFC Bank",
    network: "visa",
    category: "Cashback",
    annualFee: "1000",
    joiningFee: "1000",
    rewardsRate: "5% on Amazon, Flipkart, Swiggy & more",
    minIncome: "35000",
    minCreditScore: 720,
    perks: ["8 complimentary lounge visits", "1% fuel surcharge waiver", "Zero lost-card liability"],
    color: "#0F172A",
  },
  {
    id: "icici-amazon-pay",
    name: "Amazon Pay ICICI",
    issuer: "ICICI Bank",
    network: "visa",
    category: "Co-branded",
    annualFee: "0",
    joiningFee: "0",
    rewardsRate: "5% cashback for Prime members on Amazon",
    minIncome: "25000",
    minCreditScore: 700,
    perks: ["No-cost EMIs", "Lifetime free", "Unlimited cashback"],
    color: "#FF9900",
  },
  {
    id: "axis-magnus",
    name: "Axis Magnus",
    issuer: "Axis Bank",
    network: "mastercard",
    category: "Travel",
    annualFee: "12500",
    joiningFee: "12500",
    rewardsRate: "12 EDGE Reward Points per ₹200 spent",
    minIncome: "150000",
    minCreditScore: 760,
    perks: ["Unlimited domestic lounge access", "Priority Pass", "Buy 1 Get 1 movie tickets"],
    color: "#7C3AED",
  },
  {
    id: "sbi-cashback",
    name: "SBI Cashback Card",
    issuer: "SBI Card",
    network: "visa",
    category: "Cashback",
    annualFee: "999",
    joiningFee: "999",
    rewardsRate: "5% cashback on online spends",
    minIncome: "30000",
    minCreditScore: 700,
    perks: ["No merchant restrictions", "1% fuel surcharge waiver", "Easy auto-redemption"],
    color: "#1E40AF",
  },
  {
    id: "hdfc-regalia",
    name: "HDFC Regalia Gold",
    issuer: "HDFC Bank",
    network: "visa",
    category: "Premium",
    annualFee: "2500",
    joiningFee: "2500",
    rewardsRate: "4 reward points per ₹150",
    minIncome: "100000",
    minCreditScore: 750,
    perks: ["12 lounge visits abroad", "Priority Pass", "Marriott Bonvoy membership"],
    color: "#B45309",
  },
  {
    id: "rbl-shoprite",
    name: "RBL ShopRite",
    issuer: "RBL Bank",
    network: "mastercard",
    category: "Lifestyle",
    annualFee: "500",
    joiningFee: "500",
    rewardsRate: "20 points per ₹100 on grocery",
    minIncome: "20000",
    minCreditScore: 680,
    perks: ["Movie ticket discounts", "Welcome benefits", "Fuel surcharge waiver"],
    color: "#DC2626",
  },
  {
    id: "yes-bank-prosperity",
    name: "YES Bank Prosperity",
    issuer: "YES Bank",
    network: "rupay",
    category: "Rewards",
    annualFee: "0",
    joiningFee: "0",
    rewardsRate: "2x rewards on dining and movies",
    minIncome: "20000",
    minCreditScore: 670,
    perks: ["Lifetime free", "UPI on RuPay", "Fuel surcharge waiver"],
    color: "#047857",
  },
  {
    id: "amex-platinum-travel",
    name: "Amex Platinum Travel",
    issuer: "American Express",
    network: "amex",
    category: "Travel",
    annualFee: "5000",
    joiningFee: "3500",
    rewardsRate: "1 point per ₹50, milestone bonuses",
    minIncome: "60000",
    minCreditScore: 740,
    perks: ["Travel vouchers worth ₹40,000", "8 lounge visits", "Hotel & airline benefits"],
    color: "#0EA5E9",
  },
];

export async function seedIfEmpty(): Promise<void> {
  const lenderCount = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM lenders`,
  );
  const count = Number(lenderCount.rows[0]?.count ?? "0");
  if (count > 0) {
    logger.info({ lenders: count }, "Lenders already seeded");
  } else {
    logger.info("Seeding lenders and credit cards");
    await db.insert(lendersTable).values(
      LENDERS.map((l) => ({
        ...l,
        type: l.type,
        supportedTypes: [...l.supportedTypes],
      })),
    );
    await db.insert(creditCardsTable).values(
      CARDS.map((c) => ({ ...c, perks: [...c.perks] })),
    );
    logger.info({ lenders: LENDERS.length, cards: CARDS.length }, "Seed complete");
  }

  // Seed Urban Money integration if not present
  const umCount = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*)::text AS count FROM lender_integrations WHERE slug = 'urbanmoney'`,
  );
  if (Number(umCount.rows[0]?.count ?? "0") === 0) {
    await db.insert(lenderIntegrationsTable).values({
      id: "INTG-urbanmoney",
      name: "Urban Money",
      slug: "urbanmoney",
      apiType: "urbanmoney",
      apiEndpoint: "https://tpapi.urbanmoney.com/tpapi/v1/lead/create",
      clientId: "2aee44bcb4630f5b",
      status: "pending_whitelist",
      supportedTypes: ["personal", "home", "auto", "business", "education", "gold", "fd"],
      notes: "IP whitelist required — server IP 34.58.96.82 must be approved by Urban Money UAT team before going live.",
    });
    logger.info("Seeded Urban Money lender integration");
  }
}

async function ensureUser(phone: string, name: string, role: string, partnerCode?: string): Promise<{ id: number; phone: string | null; name: string | null; role: string }> {
  let user = (await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1))[0];
  if (!user) {
    user = (await db.insert(usersTable).values({ phone, name, role, partnerCode: partnerCode ?? null }).returning())[0]!;
    logger.info({ phone, role }, "Seeded demo role user");
  } else if (user.role !== role) {
    user = (await db.update(usersTable).set({ role, partnerCode: partnerCode ?? user.partnerCode, name: user.name ?? name }).where(eq(usersTable.id, user.id)).returning())[0]!;
    logger.info({ phone, role }, "Updated demo role user");
  }
  return user;
}

export async function seedDemoRoles(): Promise<void> {
  const admin = await ensureUser("9000000001", "Admin Demo", "admin");
  const partner = await ensureUser("9000000002", "Sales Partner Demo", "sales_partner", "QSP-00001");
  const collector = await ensureUser("9000000003", "Collection Demo", "collection_partner", "QCP-00001");

  // Seed sample customers + loan apps for partner & collector demo
  const existingPartnerLeads = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.referredByPartnerId, partner.id)).limit(1);
  if (existingPartnerLeads.length === 0) {
    const customers = [
      { phone: "9111100001", name: "Rahul Verma" },
      { phone: "9111100002", name: "Priya Sharma" },
      { phone: "9111100003", name: "Amit Patel" },
      { phone: "9111100004", name: "Sneha Iyer" },
      { phone: "9111100005", name: "Vikram Singh" },
      { phone: "9111100006", name: "Kavita Reddy" },
    ];
    const seededCustomers: Array<{ id: number; name: string; phone: string }> = [];
    for (const c of customers) {
      let u = (await db.select().from(usersTable).where(eq(usersTable.phone, c.phone)).limit(1))[0];
      if (!u) {
        u = (await db.insert(usersTable).values({ phone: c.phone, name: c.name }).returning())[0]!;
      }
      seededCustomers.push({ id: u.id, name: c.name, phone: c.phone });
    }

    const lenders = await db.select().from(lendersTable).limit(5);
    const lenderList = lenders.length > 0 ? lenders : [{ id: "hdfc", name: "HDFC Bank", minRate: "10.5" }] as any;

    const samples = [
      { idx: 0, type: "personal", amount: 250000, tenure: 36, status: "submitted", dpd: 0 },
      { idx: 1, type: "home", amount: 4500000, tenure: 240, status: "approved", dpd: 0 },
      { idx: 2, type: "auto", amount: 800000, tenure: 60, status: "disbursed", dpd: 0 },
      { idx: 3, type: "personal", amount: 350000, tenure: 24, status: "disbursed", dpd: 15 },
      { idx: 4, type: "business", amount: 1500000, tenure: 48, status: "disbursed", dpd: 45 },
      { idx: 5, type: "personal", amount: 200000, tenure: 36, status: "disbursed", dpd: 95 },
    ];
    for (const s of samples) {
      const cust = seededCustomers[s.idx]!;
      const lender = lenderList[s.idx % lenderList.length]!;
      const interestRate = Number(lender.minRate ?? 11) + 1;
      const emi = calcEmi(s.amount, interestRate, s.tenure).toFixed(2);
      const id = genId("LOAN");
      const ref = genId("REF");
      const history = [
        { status: "submitted", at: new Date(Date.now() - 30 * 86400000).toISOString(), note: "Lead created by partner" },
      ];
      if (s.status !== "submitted") history.push({ status: "approved", at: new Date(Date.now() - 25 * 86400000).toISOString(), note: "KYC verified" });
      if (s.status === "disbursed") history.push({ status: "disbursed", at: new Date(Date.now() - 22 * 86400000).toISOString(), note: "Disbursed to bank account" });
      const outstanding = s.status === "disbursed" ? s.amount * 0.85 : null;
      const commission = s.status === "disbursed" ? (s.amount * 0.012).toFixed(2) : null;
      await db.insert(loanApplicationsTable).values({
        id,
        userId: cust.id,
        lenderId: lender.id,
        lenderName: lender.name,
        type: s.type,
        amount: String(s.amount),
        tenureMonths: s.tenure,
        interestRate: String(interestRate),
        emi,
        status: s.status,
        referenceCode: ref,
        statusHistory: history,
        referredByPartnerId: partner.id,
        commissionAmount: commission,
        commissionPaid: false,
        assignedCollectorId: s.dpd > 0 ? collector.id : null,
        dpd: s.dpd,
        outstandingAmount: outstanding ? String(outstanding.toFixed(2)) : null,
        recoveredAmount: "0",
        customerName: cust.name,
        customerPhone: cust.phone,
        purpose: `${s.type} requirement`,
      });
      if (commission) {
        await db.insert(partnerPayoutsTable).values({
          partnerId: partner.id,
          applicationId: id,
          amount: commission,
          status: s.idx === 2 ? "paid" : "pending",
          paidAt: s.idx === 2 ? new Date(Date.now() - 10 * 86400000) : null,
        });
      }
    }
    logger.info("Seeded sample partner leads and overdue cases");
  }
}
