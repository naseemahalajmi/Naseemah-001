import type { FastifyReply, FastifyRequest } from "fastify";
import { pool } from "./db.js";

const COOKIE = "naseemah_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
};

export async function createSession(userId: string, reply: FastifyReply): Promise<void> {
  const result = await pool.query<{ id: string }>(
    `insert into sessions (user_id, expires_at)
     values ($1, now() + ($2 * interval '1 day'))
     returning id`,
    [userId, SESSION_DAYS],
  );
  const sessionId = result.rows[0].id;
  reply.setCookie(COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    signed: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = request.cookies[COOKIE];
  if (raw) {
    const unsigned = request.unsignCookie(raw);
    if (unsigned.valid && unsigned.value) {
      await pool.query(`delete from sessions where id = $1`, [unsigned.value]);
    }
  }
  reply.clearCookie(COOKIE, { path: "/" });
}

export async function currentUser(request: FastifyRequest): Promise<CurrentUser | null> {
  const raw = request.cookies[COOKIE];
  if (!raw) {
    return null;
  }
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) {
    return null;
  }
  const result = await pool.query<{
    id: string;
    email: string;
    display_name: string;
  }>(
    `select u.id, u.email, u.display_name
     from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [unsigned.value],
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return { id: row.id, email: row.email, displayName: row.display_name };
}
