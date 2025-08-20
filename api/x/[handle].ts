export const config = { runtime: "edge" };

const MIRRORS = (h: string) => [
  // prefer RSS-friendly sources first
  `https://xcancel.com/${h}/rss`,
  `https://twiiit.com/${h}/rss`,

  // Nitter mirrors (avoid those with Anubis)
  `https://nitter.poast.org/${h}/rss`,
  `https://nitter.net/${h}/rss`,
  `https://nitter.fdn.fr/${h}/rss`,
  `https://nitter.lacontrevoie.fr/${h}/rss`,
  `https://nitter.alefvanoon.xyz/${h}/rss`,
  `https://nitter.namazso.eu/${h}/rss`,
  `https://nitter.kavin.rocks/${h}/rss`,
  `https://n.opnxng.com/${h}/rss`,
  `https://nitter.cc/${h}/rss`
  // DO NOT include tiekoetter / privacydev – they’re behind Anubis often.
];

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36 FeedReader/1.0",
  "Accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.8",
  "Referer": "https://feedly.com/"
};

const TIMEOUT_MS = 8000;

function looksLikeRSS(ct: string | null, peek: string) {
  if (ct && /xml|rss|atom/i.test(ct)) return true;
  // Guard: skip HTML challenges
  const p = peek.slice(0, 512).toLowerCase();
  if (p.includes("<html") || p.includes("anubis") || p.includes("just a moment")) return false;
  return p.startsWith("<?xml") || p.includes("<rss") || p.includes("<feed");
}

async function fetchWithTimeout(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: HEADERS, redirect: "follow", signal: ctrl.signal });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type");
    // Read small peek to decide if it’s RSS
    const peek = await r.clone().text();
    if (!looksLikeRSS(ct, peek)) return null;

    // If OK, return full body (we already have it in peek)
    return new Response(peek, {
      status: 200,
      headers: {
        "content-type": ct || "application/rss+xml; charset=utf-8",
        "cache-control": "public, s-maxage=180, stale-while-revalidate=600",
        "access-control-allow-origin": "*"
      }
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req: Request) {
  const h = new URL(req.url).pathname.split("/").pop()!.toLowerCase();
  if (!h) return new Response("Missing handle", { status: 400 });

  for (const url of MIRRORS(h)) {
    const res = await fetchWithTimeout(url);
    if (res) return res;
  }
  return new Response("All mirrors failed", { status: 502 });
}
