import { riotFetch } from "./http";

export type Shard = "ap" | "na" | "eu" | "kr" | "latam" | "br";

export interface Session {
  accessToken: string;
  entitlement: string;
  puuid: string;
  shard: Shard;
}

export type AuthErrorCode =
  | "bad_credentials"
  | "rate_limited"
  | "mfa_failed"
  | "network"
  | "unknown";

export type AuthOutcome =
  | { status: "ok"; session: Session }
  | { status: "mfa" }
  | { status: "error"; code: AuthErrorCode; detail?: string };

export function errorToCode(err: unknown): AuthErrorCode {
  if (
    err === "bad_credentials" ||
    err === "rate_limited" ||
    err === "mfa_failed" ||
    err === "network" ||
    err === "unknown"
  ) {
    return err;
  }
  return "unknown";
}

/** Carries Riot's HTTP status / error code to the UI for honest diagnostics. */
export class RiotError extends Error {
  constructor(
    public code: AuthErrorCode,
    public status?: number,
    public detail?: string,
  ) {
    super([code, status?.toString(), detail].filter(Boolean).join(" "));
  }
}

function errorToDetail(err: unknown): string | undefined {
  if (!(err instanceof RiotError)) return undefined;
  return [err.status, err.detail].filter(Boolean).join(" ") || undefined;
}

function asError(err: unknown): { code: AuthErrorCode; detail?: string } {
  return { code: errorToCode(err), detail: errorToDetail(err) };
}

/** Tokens live in the redirect fragment: #access_token=...&id_token=... */
export function parseFragment(
  fragmentOrUri: string,
): { accessToken: string; idToken: string } | null {
  const hashIndex = fragmentOrUri.indexOf("#");
  const raw = hashIndex === -1 ? fragmentOrUri : fragmentOrUri.slice(hashIndex + 1);
  const params = new URLSearchParams(raw);
  const accessToken = params.get("access_token");
  const idToken = params.get("id_token");
  if (!accessToken || !idToken) return null;
  return { accessToken, idToken };
}

/** puuid ships as the `sub` claim of Riot's id_token JWT. */
export function puuidFromIdToken(idToken: string): string | null {
  const part = idToken.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// affinity values that need mapping to PD shards (community-verified set)
const AFFINITY_TO_SHARD: Record<string, Shard> = {
  na: "na",
  eu: "eu",
  ap: "ap",
  kr: "kr",
  latam: "latam",
  br: "br",
  as: "ap",
  ind: "ap",
  oce: "ap",
  jp: "ap",
  ru: "eu",
  tr: "eu",
};

/** userinfo.affinity.pp is the real PD shard; falls back to ap (primary audience). */
export function shardFromAffinity(
  affinity: Record<string, string> | undefined,
): Shard {
  const raw =
    affinity?.pp || affinity?.live || Object.values(affinity ?? {})[0];
  return (raw && AFFINITY_TO_SHARD[raw.toLowerCase()]) || "ap";
}

interface UserinfoBody {
  sub?: string;
  affinity?: Record<string, string>;
}

async function getUserinfo(accessToken: string): Promise<UserinfoBody | null> {
  let res: Response;
  try {
    res = await riotFetch("https://auth.riotgames.com/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  try {
    return (await res.json()) as UserinfoBody;
  } catch {
    return null;
  }
}

// ponytail: nonce is echoed, not verified, in the implicit response_type flow
export function authorizeUrl(): string {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const params = new URLSearchParams({
    client_id: "play-valorant-web-prod",
    redirect_uri: "https://playvalorant.com/opt_in",
    response_type: "token id_token",
    scope: "openid account",
    nonce,
  });
  return `https://auth.riotgames.com/authorize?${params.toString()}`;
}

/**
 * Desktop-only webview login: Riot's official hosted page (captcha + every
 * social platform button work there), token captured from the redirect
 * fragment. Mobile uses the system-browser + paste flow instead — no
 * multi-webview there, and Riot's headless contract is closed.
 */
export async function signInWithRiot(): Promise<AuthOutcome> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const fragment = await invoke<string>("riot_login", { url: authorizeUrl() });
    const tokens = parseFragment(fragment);
    if (!tokens) {
      return { status: "error", code: "unknown", detail: "no tokens in redirect" };
    }
    return await finishSession(tokens);
  } catch (err) {
    return { status: "error", ...asError(err) };
  }
}

/**
 * Mobile-only fallback: the user signs in via the system browser (Riot's
 * hosted page) and pastes back the redirected playvalorant.com URL, which
 * carries the token fragment. Nothing is stored anywhere.
 */
export async function completeSignInFromUrl(
  redirectUrl: string,
): Promise<AuthOutcome> {
  const tokens = parseFragment(redirectUrl);
  if (!tokens) {
    return {
      status: "error",
      code: "unknown",
      detail: "no access_token in that URL",
    };
  }
  return finishSession(tokens);
}

async function collectSession(
  accessToken: string,
  puuid: string,
  shard: Shard,
): Promise<Session> {
  let res: Response;
  try {
    // moved from GET /api/token/tdm (dead) to POST /api/token/v1 (current)
    res = await riotFetch("https://entitlements.auth.riotgames.com/api/token/v1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new RiotError("network");
  }
  if (res.status === 429) throw new RiotError("rate_limited", 429);
  if (!res.ok) throw new RiotError("unknown", res.status, "entitlements");
  const body = (await res.json()) as { entitlements_token?: string };
  if (!body.entitlements_token) {
    throw new RiotError("unknown", 200, "no entitlements_token");
  }
  return { accessToken, entitlement: body.entitlements_token, puuid, shard };
}

async function finishSession(
  tokens: { accessToken: string; idToken: string },
): Promise<AuthOutcome> {
  // puuid + real shard come from userinfo (affinity.pp); id_token sub + the
  // storefront shard-fallback recover if userinfo fails
  const info = await getUserinfo(tokens.accessToken);
  const puuid = info?.sub ?? puuidFromIdToken(tokens.idToken);
  if (!puuid) {
    return { status: "error", code: "unknown", detail: "no puuid" };
  }
  const session = await collectSession(
    tokens.accessToken,
    puuid,
    shardFromAffinity(info?.affinity),
  );
  return { status: "ok", session };
}
