import { Router, type IRouter } from "express";
import { db, loanApplicationsTable, creditScoresTable, lendersTable, cardApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { bandFor } from "../lib/utils";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const apps = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, userId)).orderBy(desc(loanApplicationsTable.createdAt));
  const cardApps = await db.select().from(cardApplicationsTable).where(eq(cardApplicationsTable.userId, userId)).orderBy(desc(cardApplicationsTable.createdAt));
  const scoreRow = (await db.select().from(creditScoresTable).where(eq(creditScoresTable.userId, userId)).orderBy(desc(creditScoresTable.asOf)).limit(1))[0];
  const lenderCount = (await db.select().from(lendersTable)).length;

  const activeApplications = apps.filter((a) => a.status === "submitted" || a.status === "under_review" || a.status === "approved").length;
  const approvedAmount = apps.filter((a) => a.status === "approved" || a.status === "disbursed").reduce((s, a) => s + Number(a.amount), 0);
  const disbursedAmount = apps.filter((a) => a.status === "disbursed").reduce((s, a) => s + Number(a.amount), 0);
  const disbursedApps = apps.filter((a) => a.status === "disbursed");
  const nextEmiAmount = disbursedApps.reduce((s, a) => s + Number(a.emi), 0);
  const nextEmiDate = disbursedApps.length > 0 ? nextMonthFifth() : undefined;

  const statusCounts = new Map<string, number>();
  for (const a of apps) statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1);
  const applicationsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  const recentActivity = [
    ...apps.slice(0, 5).map((a) => ({
      title: `${capitalize(a.type)} loan • ${a.lenderName}`,
      detail: `₹${Number(a.amount).toLocaleString("en-IN")} • ${a.status.replace("_", " ")}`,
      at: a.createdAt.toISOString(),
      type: "loan",
    })),
    ...cardApps.slice(0, 3).map((c) => ({
      title: c.cardName,
      detail: `Status: ${c.status.replace("_", " ")}`,
      at: c.createdAt.toISOString(),
      type: "card",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  res.json({
    activeApplications,
    approvedAmount,
    disbursedAmount,
    creditScore: scoreRow?.score ?? 0,
    creditScoreBand: scoreRow ? bandFor(scoreRow.score) : undefined,
    totalLenders: lenderCount,
    nextEmiAmount: nextEmiAmount > 0 ? nextEmiAmount : undefined,
    nextEmiDate,
    recentActivity,
    applicationsByStatus,
  });
});

function nextMonthFifth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(5);
  return d.toISOString();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default router;
