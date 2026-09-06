import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "./db.js";
import { sendPasswordResetEmail } from "./mail.js";
import { clearSession, createSession, currentUser } from "./session.js";

const createUserBody = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

const loginBody = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const forgotBody = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const completeResetBody = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => ({ ok: true }));

  app.post("/api/users", async (request, reply) => {
    const parsed = createUserBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Enter a name, a valid email, and a password of at least 8 characters." });
    }
    const { displayName, email, password } = parsed.data;
    const existing = await pool.query(`select 1 from users where email = $1`, [email]);
    if (existing.rowCount) {
      return reply.code(409).send({ error: "That email already belongs to a User." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await pool.query<{ id: string; email: string; display_name: string }>(
      `insert into users (email, display_name, password_hash)
       values ($1, $2, $3)
       returning id, email, display_name`,
      [email, displayName, passwordHash],
    );
    const user = inserted.rows[0];
    await createSession(user.id, reply);
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };
  });

  app.post("/api/sessions", async (request, reply) => {
    const parsed = loginBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Email or password is wrong." });
    }
    const { email, password } = parsed.data;
    const found = await pool.query<{ id: string; email: string; display_name: string; password_hash: string }>(
      `select id, email, display_name, password_hash from users where email = $1`,
      [email],
    );
    const user = found.rows[0];
    const matches = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !matches) {
      return reply.code(401).send({ error: "Email or password is wrong." });
    }
    await createSession(user.id, reply);
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };
  });

  app.delete("/api/sessions/current", async (request, reply) => {
    await clearSession(request, reply);
    return { ok: true };
  });

  app.get("/api/me", async (request, reply) => {
    const user = await currentUser(request);
    if (!user) {
      return reply.code(401).send({ error: "Not signed in." });
    }
    return user;
  });

  app.post("/api/password-resets", async (request, reply) => {
    const parsed = forgotBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Enter a valid email." });
    }
    const { email } = parsed.data;
    const found = await pool.query<{ id: string }>(`select id from users where email = $1`, [email]);
    const user = found.rows[0];
    if (user) {
      const token = randomBytes(16).toString("hex");
      await pool.query(
        `insert into password_resets (user_id, token_hash, expires_at)
         values ($1, $2, now() + interval '1 hour')`,
        [user.id, hashToken(token)],
      );
      const webUrl = process.env.PUBLIC_WEB_URL ?? "http://localhost:5173";
      await sendPasswordResetEmail(email, `${webUrl}/reset-password/${token}`);
    }
    return reply.send({ ok: true });
  });

  app.post("/api/password-resets/complete", async (request, reply) => {
    const parsed = completeResetBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Enter a password of at least 8 characters." });
    }
    const { token, password } = parsed.data;
    const found = await pool.query<{ id: string; user_id: string }>(
      `select id, user_id
       from password_resets
       where token_hash = $1 and used_at is null and expires_at > now()`,
      [hashToken(token)],
    );
    const reset = found.rows[0];
    if (!reset) {
      return reply.code(400).send({ error: "This reset link is invalid or has expired." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query("begin");
    try {
      await pool.query(`update users set password_hash = $1 where id = $2`, [passwordHash, reset.user_id]);
      await pool.query(`update password_resets set used_at = now() where id = $1`, [reset.id]);
      await pool.query(`delete from sessions where user_id = $1`, [reset.user_id]);
      await pool.query("commit");
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
    return { ok: true };
  });
}
