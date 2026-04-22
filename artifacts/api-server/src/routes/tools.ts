import { Router, type IRouter } from "express";
import { CalculateEmiBody } from "@workspace/api-zod";
import { calcEmi, emiSchedule, round2 } from "../lib/utils";

const router: IRouter = Router();

router.post("/tools/emi", (req, res) => {
  const parsed = CalculateEmiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { principal, annualRate, tenureMonths } = parsed.data;
  const { emi, schedule } = emiSchedule(principal, annualRate, tenureMonths);
  const totalPayable = round2(emi * tenureMonths);
  const totalInterest = round2(totalPayable - principal);
  res.json({ emi, totalInterest, totalPayable, schedule });
});

export default router;
