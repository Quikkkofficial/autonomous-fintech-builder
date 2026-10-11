import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import kycRouter from "./kyc";
import creditRouter from "./credit";
import lendersRouter from "./lenders";
import loansRouter from "./loans";
import cardsRouter from "./cards";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import toolsRouter from "./tools";
import adminRouter from "./admin";
import partnerRouter from "./partner";
import collectionRouter from "./collection";
import urbanMoneyRouter from "./urbanmoney";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(kycRouter);
router.use(creditRouter);
router.use(lendersRouter);
router.use(loansRouter);
router.use(cardsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(toolsRouter);
router.use(adminRouter);
router.use(partnerRouter);
router.use(collectionRouter);
router.use(urbanMoneyRouter);
router.use(paymentsRouter);

export default router;
