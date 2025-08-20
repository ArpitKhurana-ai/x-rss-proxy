export const config = { runtime: "edge" };

const listMirrors = (id: string) => [
  `https://rsshub.app/twitter/list/${id}`,
  `https://nitter.poast.org/i/lists/${id}/rss`,
  `https://nitter.net/i/lists/${id}/rss`
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36 FeedReader/1.0",
  "Accept":
    "application/rss+xml, application/atom+xml, application/xml;q=0.9,*/*;q=0.8"
};

const TIMEOUT_MS = 8000;

async function tryFetch(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: HEADERS, redirect: "follow", signal: ctrl.signal });
    if (r.ok) {
      const body = await r.arrayBuffer();
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": r.headers.get("content-type") || "application/rss+xml; charset=utf-8",
          "cache-control": "public, s-maxage=120, stale-while-revalidate=600",
          "access-control-allow-origin": "*"
        }
      });
    }
  } catch { /* next */ }
  finally { clearTimeout(t); }
  return null;
}

export default async function handler(req: Request) {
  const id = new URL(req.url).pathname.split("/").pop()!;
  if (!id) return new Response("Missing list id", { status: 400 });
  for (const target of listMirrors(id)) {
    const res = await tryFetch(target);
    if (res) return res;
  }
  return new Response("All mirrors failed", { status: 502 });
}
