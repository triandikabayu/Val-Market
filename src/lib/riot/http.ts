// Riot fetches go through Tauri's HTTP plugin (Rust-side, no CORS, no proxy,
// nothing transits a server of ours). Dynamic import keeps this module usable
// in non-Tauri contexts (tests, plain `next dev` in a browser tab).
export async function riotFetch(url: string, init?: RequestInit): Promise<Response> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  return fetch(url, init);
}
