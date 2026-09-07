import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

export const RATES_URL = "https://open.er-api.com/v6/latest/KWD";
export const RATES_SNAPSHOT_URL =
  process.env.RATES_SNAPSHOT_URL ??
  "https://raw.githubusercontent.com/naseemahalajmi/Naseemah-001/main/apps/api/data/kuwait-rates.json";

const HOUR_MS = 60 * 60 * 1000;
const SNAPSHOT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "kuwait-rates.json");

const CURRENCIES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "EURO",
  GBP: "Pound Sterling",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  SAR: "Saudi Riyal",
  AED: "Emirati Dirham",
  QAR: "Qatari Riyal",
  BHD: "Bahraini Dinar",
  OMR: "Omani Rial",
};

export type KuwaitRate = {
  currencyCode: string;
  currencyName: string;
  filsPerUnit: string;
  publishedLabel: string | null;
  sourceUrl: string;
  fetchedAt: string;
};

type ErApiResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

type ParsedRates = {
  publishedLabel: string | null;
  rates: Array<{ currencyName: string; currencyCode: string; filsPerUnit: string }>;
  sourceUrl: string;
  raw?: ErApiResponse;
};

function filsPerUnit(foreignPerKwd: number): string {
  if (!Number.isFinite(foreignPerKwd) || foreignPerKwd <= 0) {
    throw new Error("Invalid foreign-per-KWD rate.");
  }
  return (1000 / foreignPerKwd).toFixed(4);
}

export function parseErApi(payload: ErApiResponse, sourceUrl: string): ParsedRates {
  if (payload.result !== "success" || !payload.rates) {
    throw new Error("Rates payload was not a success table.");
  }

  const rates: ParsedRates["rates"] = [];
  for (const [currencyCode, currencyName] of Object.entries(CURRENCIES)) {
    const foreignPerKwd = payload.rates[currencyCode];
    if (typeof foreignPerKwd !== "number") {
      continue;
    }
    rates.push({
      currencyCode,
      currencyName,
      filsPerUnit: filsPerUnit(foreignPerKwd),
    });
  }

  if (rates.length === 0) {
    throw new Error("Rates payload did not include the Kuwait currency set.");
  }

  return {
    publishedLabel: payload.time_last_update_utc?.trim() ?? null,
    rates,
    sourceUrl,
    raw: payload,
  };
}

async function fetchJson(url: string): Promise<ErApiResponse> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`${url} responded with ${response.status}.`);
  }
  return (await response.json()) as ErApiResponse;
}

async function loadFromDisk(): Promise<ParsedRates> {
  const raw = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")) as ErApiResponse;
  return parseErApi(raw, SNAPSHOT_PATH);
}

async function loadRates(): Promise<ParsedRates> {
  try {
    const live = parseErApi(await fetchJson(RATES_URL), RATES_URL);
    if (live.raw) {
      await writeFile(SNAPSHOT_PATH, `${JSON.stringify(live.raw)}\n`, "utf8");
    }
    return live;
  } catch (error) {
    console.warn("Live rates fetch failed, trying snapshot:", error);
  }

  try {
    return parseErApi(await fetchJson(RATES_SNAPSHOT_URL), RATES_SNAPSHOT_URL);
  } catch (error) {
    console.warn("GitHub snapshot fetch failed, trying local file:", error);
  }

  return loadFromDisk();
}

async function persistRates(parsed: ParsedRates): Promise<number> {
  const batchId = randomUUID();
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const rate of parsed.rates) {
      await client.query(
        `insert into kuwait_rates
          (batch_id, currency_code, currency_name, fils_per_unit, published_label, source_url)
         values ($1, $2, $3, $4, $5, $6)`,
        [batchId, rate.currencyCode, rate.currencyName, rate.filsPerUnit, parsed.publishedLabel, parsed.sourceUrl],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
  return parsed.rates.length;
}

export async function refreshKuwaitRates(): Promise<number> {
  try {
    return await persistRates(await loadRates());
  } catch (error) {
    const existing = await latestKuwaitRates();
    if (existing.rates.length > 0) {
      console.warn("Keeping last stored rates; refresh sources were unavailable.", error);
      return existing.rates.length;
    }
    throw error;
  }
}

export async function latestKuwaitRates(): Promise<{
  sourceUrl: string;
  publishedLabel: string | null;
  fetchedAt: string | null;
  nextRefreshAt: string | null;
  rates: KuwaitRate[];
}> {
  const result = await pool.query<{
    currency_code: string;
    currency_name: string;
    fils_per_unit: string;
    published_label: string | null;
    source_url: string;
    fetched_at: Date;
  }>(
    `select currency_code, currency_name, fils_per_unit, published_label, source_url, fetched_at
     from kuwait_rates
     where fetched_at = (select max(fetched_at) from kuwait_rates)
     order by currency_code`,
  );

  const first = result.rows[0];
  const fetchedAt = first?.fetched_at?.toISOString() ?? null;
  return {
    sourceUrl: first?.source_url ?? RATES_URL,
    publishedLabel: first?.published_label ?? null,
    fetchedAt,
    nextRefreshAt: fetchedAt ? new Date(Date.parse(fetchedAt) + HOUR_MS).toISOString() : null,
    rates: result.rows.map((row) => ({
      currencyCode: row.currency_code,
      currencyName: row.currency_name,
      filsPerUnit: String(row.fils_per_unit),
      publishedLabel: row.published_label,
      sourceUrl: row.source_url,
      fetchedAt: row.fetched_at.toISOString(),
    })),
  };
}

export function startHourlyKuwaitRateRefresh(): void {
  const run = async (reason: string) => {
    try {
      const count = await refreshKuwaitRates();
      console.log(`Kuwait rates refresh (${reason}): stored ${count} currencies.`);
    } catch (error) {
      console.error(`Kuwait rates refresh failed (${reason}):`, error);
    }
  };

  void run("startup");
  setInterval(() => {
    void run("hourly");
  }, HOUR_MS);
}
