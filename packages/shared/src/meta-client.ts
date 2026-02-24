/**
 * Meta Graph API client: pagination, retry/backoff, rate-limit handling.
 * Used by API and Worker. Never log tokens.
 */

const BASE = "https://graph.facebook.com/v21.0";

export interface MetaClientConfig {
  accessToken: string;
  maxRetries?: number;
  backoffMs?: number;
  rateLimitRetryAfterMs?: number;
}

export interface MetaPagingCursor {
  after?: string;
  before?: string;
  next?: string;
  previous?: string;
}

export interface MetaResponse<T> {
  data?: T[];
  paging?: MetaPagingCursor;
  error?: { message: string; code: number; error_subcode?: number };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function metaFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  config: MetaClientConfig
): Promise<MetaResponse<T>> {
  const url = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });
  if (!url.searchParams.has("access_token") && config.accessToken) {
    url.searchParams.set("access_token", config.accessToken);
  }
  const maxRetries = config.maxRetries ?? 3;
  const backoffMs = config.backoffMs ?? 1000;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as MetaResponse<T> & { error?: { message: string; code: number } };
      if (data.error) {
        const code = data.error.code;
        if (code === 4 || code === 17) {
          const wait = config.rateLimitRetryAfterMs ?? 60000;
          if (attempt < maxRetries) {
            await sleep(wait);
            continue;
          }
        }
        throw new Error(data.error.message || "Meta API error");
      }
      return data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        await sleep(backoffMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError || new Error("Meta request failed");
}

/** Fetch all pages using cursor. */
export async function metaFetchAll<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  config: MetaClientConfig
): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined = `${path}?${new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== "") acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString()}`;
  while (next) {
    const fullUrl = next.startsWith("http") ? next : BASE + next;
    const res = await fetch(
      fullUrl + (fullUrl.includes("?") ? "&" : "?") + "access_token=" + encodeURIComponent(config.accessToken),
      { headers: { "Content-Type": "application/json" } }
    );
    const json = (await res.json()) as MetaResponse<T>;
    if (json.error) throw new Error(json.error.message);
    if (json.data) out.push(...json.data);
    next = json.paging?.next ?? undefined;
  }
  return out;
}

/** Get ad accounts for the token user. */
export async function getAdAccounts(config: MetaClientConfig): Promise<{ id: string; name: string; account_id: string }[]> {
  const res = await metaFetch<{ id: string; name: string; account_id: string }>(
    "/me/adaccounts",
    { fields: "id,name,account_id" },
    config
  );
  return res.data ?? [];
}
