import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { ensureMongo } from "./lib/mongo";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
// Capture the raw body so HMAC-signed webhooks (e.g. Cashfree UPI)
// can be verified with timing-safe comparison.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: string }).rawBody = buf.toString("utf8");
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// Ensure the MongoDB connection is up before any route handler runs.
// Failures are logged here; individual handlers will surface a clear error.
app.use(async (_req, _res, next) => {
  try {
    await ensureMongo();
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : err },
      "MongoDB connection not ready",
    );
  }
  next();
});

app.use("/api", router);

export default app;
