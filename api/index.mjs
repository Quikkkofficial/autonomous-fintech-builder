// Vercel serverless function: hosts the Express API under /api/*.
//
// The Express app (artifacts/api-server/src/app.ts) mounts all routes under
// "/api" and is bundled into a single self-contained file at
// artifacts/api-server/dist/app.mjs by `pnpm --filter @workspace/api-server
// build` (see artifacts/api-server/build.mjs), which runs as part of the
// Vercel build command before functions are bundled — so this import always
// resolves to a fresh, dependency-free bundle.
import app from "../artifacts/api-server/dist/app.mjs";

export default function handler(req, res) {
  // Vercel may strip the "/api" prefix when routing to this function, or pass
  // the original URL through — normalize so the Express router always sees
  // paths under "/api" either way.
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
