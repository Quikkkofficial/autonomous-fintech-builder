import { useEffect } from "react";
import { useLocation } from "wouter";

interface RouteSeo {
  title: string;
  description: string;
  path: string;
}

const SITE = "https://quikkk.com";
const DEFAULT_OG_IMAGE = `${SITE}/opengraph.jpg`;

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Quikkk — Compare Personal Loans & Credit Cards Online in India",
    description:
      "Quikkk is India's smartest credit marketplace. Compare personal loans, home loans, business loans and credit cards from regulated banks & NBFCs, get pre-approved offers in seconds.",
  },
  "/about": {
    title: "About Quikkk — India's Smartest Credit Marketplace",
    description:
      "Learn about Quikkk by Mekyek Global Services Pvt Ltd — the digital loan & credit card aggregator helping India compare offers from regulated lenders. Contact info@quikkk.com.",
  },
  "/terms": {
    title: "Terms & Conditions — Quikkk",
    description:
      "Quikkk terms & conditions, privacy policy and grievance redressal. Quikkk is a loan & credit card aggregator; loans are sanctioned solely by regulated lending partners.",
  },
  "/sign-in": {
    title: "Sign In — Quikkk",
    description: "Sign in to Quikkk to compare loan and credit card offers from regulated lenders.",
  },
  "/sign-up": {
    title: "Create Account — Quikkk",
    description: "Create your free Quikkk account and compare loans and credit cards in seconds.",
  },
  "/dashboard": {
    title: "Dashboard — Quikkk",
    description: "Your Quikkk dashboard — track applications, offers and credit health.",
  },
  "/loans": {
    title: "Compare Loans Online — Quikkk",
    description:
      "Compare personal, home, auto and business loan offers from 12+ banks & NBFCs. Check your pre-approved offers on Quikkk.",
  },
  "/loans/results": {
    title: "Your Loan Offers — Quikkk",
    description: "Your personalized pre-approved loan offers from regulated lenders on Quikkk.",
  },
  "/lenders": {
    title: "Our Lending Partners — Quikkk",
    description: "Browse Quikkk's network of regulated banks and NBFC lending partners across India.",
  },
  "/credit-cards": {
    title: "Compare Credit Cards Online — Quikkk",
    description:
      "Compare credit cards from leading banks — rewards, cashback, travel and fuel cards. Find the best card for you on Quikkk.",
  },
  "/tools/emi": {
    title: "EMI Calculator — Quikkk",
    description:
      "Free EMI calculator — compute monthly EMI for personal, home, auto and business loans instantly on Quikkk.",
  },
  "/kyc": {
    title: "Complete KYC — Quikkk",
    description: "Complete your KYC on Quikkk to unlock personalized loan and credit card offers.",
  },
  "/applications": {
    title: "My Applications — Quikkk",
    description: "Track the status of your loan and credit card applications on Quikkk.",
  },
  "/notifications": {
    title: "Notifications — Quikkk",
    description: "Your Quikkk notifications — offer updates, application status and reminders.",
  },
  "/profile": {
    title: "My Profile — Quikkk",
    description: "Manage your Quikkk profile, documents and preferences.",
  },
  "/admin": {
    title: "Admin Console — Quikkk",
    description: "Quikkk admin console — manage users, applications, lenders and payouts.",
  },
  "/partner": {
    title: "Partner Portal — Quikkk",
    description: "Quikkk partner portal — manage leads, track payouts and grow your business.",
  },
  "/collection": {
    title: "Collections — Quikkk",
    description: "Quikkk collections workspace — manage cases and follow-ups.",
  },
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function lookupSeo(pathname: string): RouteSeo {
  const clean = pathname.split("?")[0].split("#")[0] || "/";
  // Prefer exact match, then progressively shorter prefixes (e.g. /admin/users -> /admin)
  if (ROUTE_SEO[clean]) return { path: clean, ...ROUTE_SEO[clean] };
  const segs = clean.split("/").filter(Boolean);
  while (segs.length > 1) {
    segs.pop();
    const prefix = "/" + segs.join("/");
    if (ROUTE_SEO[prefix]) return { path: prefix, ...ROUTE_SEO[prefix] };
  }
  return { path: "/", ...ROUTE_SEO["/"] };
}

/**
 * Keeps <title>, meta description, Open Graph / Twitter tags and the
 * canonical URL in sync with client-side routing so every route has
 * meaningful SEO metadata when shared or crawled.
 */
export function SeoHead() {
  const [pathname] = useLocation();

  useEffect(() => {
    const { title, description, path } = lookupSeo(pathname);
    const url = `${SITE}${path === "/" ? "/" : path}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);
    upsertCanonical(url);
  }, [pathname]);

  return null;
}
