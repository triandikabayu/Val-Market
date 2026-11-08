// Documented-working platform blob (valapidocs.techchrism.me/endpoint/storefront).
export const CLIENT_PLATFORM =
  "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

let cachedVersion: string | null = null;

export async function getClientVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  const res = await fetch("https://valorant-api.com/v1/version");
  if (!res.ok) throw new Error("version fetch failed");
  const json = (await res.json()) as {
    data?: { riotClientVersion?: string };
  };
  const version = json.data?.riotClientVersion;
  if (!version) throw new Error("no client version in response");
  cachedVersion = version;
  return version;
}
