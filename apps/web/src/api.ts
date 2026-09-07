export type UserPublic = {
  id: string;
  email: string;
  displayName: string;
};

type ApiError = {
  error?: string;
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

export function createUser(body: { displayName: string; email: string; password: string }) {
  return api<UserPublic>("/users", { method: "POST", body: JSON.stringify(body) });
}

export function login(body: { email: string; password: string }) {
  return api<UserPublic>("/sessions", { method: "POST", body: JSON.stringify(body) });
}

export function signOut() {
  return api<{ ok: boolean }>("/sessions/current", { method: "DELETE" });
}

export function me() {
  return api<UserPublic>("/me");
}

export type KuwaitRate = {
  currencyCode: string;
  currencyName: string;
  filsPerUnit: string;
};

export type KuwaitRatesSnapshot = {
  sourceUrl: string;
  publishedLabel: string | null;
  fetchedAt: string | null;
  nextRefreshAt: string | null;
  rates: KuwaitRate[];
};

export function kuwaitRates() {
  return api<KuwaitRatesSnapshot>("/kuwait-rates");
}

export function requestPasswordReset(email: string) {
  return api<{ ok: boolean }>("/password-resets", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function completePasswordReset(token: string, password: string) {
  return api<{ ok: boolean }>("/password-resets/complete", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
