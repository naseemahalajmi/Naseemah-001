import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { ensureSchema } from "./db.js";
import { startHourlyKuwaitRateRefresh } from "./kuwaitRates.js";
import { registerRoutes } from "./modules.js";

const port = Number(process.env.PORT ?? 3000);
const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET is required");
}

const app = Fastify({ logger: true });

await app.register(cookie, { secret, hook: "onRequest" });
await ensureSchema();
await registerRoutes(app);
startHourlyKuwaitRateRefresh();

await app.listen({ port, host: "0.0.0.0" });
