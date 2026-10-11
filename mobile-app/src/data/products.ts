// Product catalog — mirrors the web platform's 10 product cards.

export interface Product {
  id: string;
  name: string;
  range: string;
  rate: string;
  description: string;
  iconBg: string;
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "personal-loan",
    name: "Personal Loan",
    range: "₹25K – ₹40L",
    rate: "from 10.49% p.a.",
    description: "Unsecured loans for any personal need — medical, travel, wedding or emergencies.",
    iconBg: "#EB1414",
    features: ["No collateral needed", "Disbursal in 24 hours", "Tenure up to 60 months"],
  },
  {
    id: "home-loan",
    name: "Home Loan",
    range: "₹5L – ₹5Cr",
    rate: "from 8.40% p.a.",
    description: "Finance your dream home with low rates from top banks and HFCs.",
    iconBg: "#141414",
    features: ["Balance transfer available", "Tenure up to 30 years", "Tax benefits under 80C"],
  },
  {
    id: "auto-loan",
    name: "Auto Loan",
    range: "₹1L – ₹50L",
    rate: "from 9.25% p.a.",
    description: "Drive home your car or bike with quick approval and flexible EMIs.",
    iconBg: "#EB1414",
    features: ["Up to 100% on-road funding", "New & used cars", "Same-day approval"],
  },
  {
    id: "business-loan",
    name: "Business Loan",
    range: "₹1L – ₹2Cr",
    rate: "from 14.50% p.a.",
    description: "Working capital and expansion loans for MSMEs and growing businesses.",
    iconBg: "#141414",
    features: ["Minimal documentation", "No collateral up to ₹75L", "Tenure up to 5 years"],
  },
  {
    id: "education-loan",
    name: "Education Loan",
    range: "₹50K – ₹1Cr",
    rate: "from 9.95% p.a.",
    description: "Fund studies in India or abroad with moratorium during the course.",
    iconBg: "#EB1414",
    features: ["Moratorium period included", "Covers tuition + living", "Tax benefits under 80E"],
  },
  {
    id: "gold-loan",
    name: "Gold Loan",
    range: "₹10K – ₹50L",
    rate: "from 7.00% p.a.",
    description: "Instant loans against gold ornaments with part-release facility.",
    iconBg: "#EAB308",
    features: ["Disbursal in 30 minutes", "Bullet & EMI options", "Secure insured vaults"],
  },
  {
    id: "fd-loan",
    name: "FD Loan",
    range: "Up to 90% of FD",
    rate: "~1–2% over FD rate",
    description: "Overdraft against your fixed deposit — FD keeps earning interest.",
    iconBg: "#2563EB",
    features: ["FD stays intact", "Pay interest only on usage", "Instant activation"],
  },
  {
    id: "mf-loan",
    name: "Mutual Fund Loan",
    range: "₹50K – ₹5Cr",
    rate: "from 9.00% p.a.",
    description: "Loan against mutual fund units without redeeming your investments.",
    iconBg: "#059669",
    features: ["No redemption needed", "Digital lien marking", "Flexible repayment"],
  },
  {
    id: "insurance-loan",
    name: "Insurance Loan",
    range: "₹10K – ₹50L",
    rate: "from 9.00% p.a.",
    description: "Borrow against your life insurance policy's surrender value.",
    iconBg: "#7C3AED",
    features: ["Lower than personal loan rates", "Policy stays active", "Quick processing"],
  },
  {
    id: "credit-cards",
    name: "Credit Cards",
    range: "Premium card range",
    rate: "Lifetime free options",
    description: "Compare lifetime-free and premium cards with rewards that suit you.",
    iconBg: "#141414",
    features: ["Lifetime free options", "Cashback & rewards", "Instant virtual card"],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
