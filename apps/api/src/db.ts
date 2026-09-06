import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new pg.Pool({ connectionString: url });

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    create extension if not exists pgcrypto;

    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      display_name text not null,
      password_hash text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );

    create table if not exists password_resets (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    );
  `);
}
