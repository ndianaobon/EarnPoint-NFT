// Server-only: this file reads the OpenSea API key, which must never reach the browser.

export type MarketNft = {
  key: string;
  name: string;
  collection: string;
  imageUrl: string;
  openseaUrl: string;
};

export type MarketFeed =
  | { status: "ok"; nfts: MarketNft[] }
  | { status: "not-configured" | "unavailable"; nfts: [] };

type OpenSeaNft = {
  identifier?: unknown;
  collection?: unknown;
  contract?: unknown;
  name?: unknown;
  display_image_url?: unknown;
  image_url?: unknown;
  opensea_url?: unknown;
  is_disabled?: unknown;
  is_nsfw?: unknown;
};

const API_BASE = process.env.OPENSEA_API_BASE ?? "https://api.opensea.io/api/v2";
const DEFAULT_COLLECTIONS = ["pudgypenguins", "azuki", "doodles-official", "cool-cats-nft"];
const REFRESH_SECONDS = 300;
const PER_COLLECTION = 4;

function httpsUrl(value: unknown, requiredHost?: string) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (requiredHost && url.hostname !== requiredHost) return null;
    return url.href;
  } catch {
    return null;
  }
}

function toMarketNft(raw: OpenSeaNft, slug: string): MarketNft | null {
  if (raw.is_disabled !== false || raw.is_nsfw !== false) return null;
  const imageUrl = httpsUrl(raw.display_image_url) ?? httpsUrl(raw.image_url);
  const openseaUrl = httpsUrl(raw.opensea_url, "opensea.io");
  const identifier = typeof raw.identifier === "string" ? raw.identifier : null;
  if (!imageUrl || !openseaUrl || !identifier) return null;

  const collection = typeof raw.collection === "string" ? raw.collection : slug;
  return {
    key: `${raw.contract}:${identifier}`,
    name: typeof raw.name === "string" && raw.name ? raw.name : `#${identifier}`,
    collection,
    imageUrl,
    openseaUrl,
  };
}

async function fetchCollection(slug: string, apiKey: string) {
  const res = await fetch(
    `${API_BASE}/collection/${encodeURIComponent(slug)}/nfts?limit=${PER_COLLECTION}`,
    {
      headers: { accept: "application/json", "x-api-key": apiKey },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) throw new Error(`OpenSea returned ${res.status} for ${slug}`);
  const data = (await res.json()) as { nfts?: OpenSeaNft[] };
  return (data.nfts ?? [])
    .map((nft) => toMarketNft(nft, slug))
    .filter((nft) => nft !== null);
}

export async function getMarketNfts(limit: number): Promise<MarketFeed> {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return { status: "not-configured", nfts: [] };

  const slugs = (process.env.OPENSEA_COLLECTIONS?.split(",") ?? DEFAULT_COLLECTIONS)
    .map((slug) => slug.trim())
    .filter(Boolean);

  const results = await Promise.allSettled(slugs.map((slug) => fetchCollection(slug, apiKey)));
  const lists: MarketNft[][] = [];
  for (const result of results) {
    if (result.status === "fulfilled") lists.push(result.value);
    else console.warn("[market]", String(result.reason));
  }

  // Take one from each collection in turn so the grid shows a mix.
  const nfts: MarketNft[] = [];
  for (let i = 0; i < PER_COLLECTION && nfts.length < limit; i++) {
    for (const list of lists) {
      const nft = list.at(i);
      if (nft && nfts.length < limit) nfts.push(nft);
    }
  }

  return nfts.length > 0 ? { status: "ok", nfts } : { status: "unavailable", nfts: [] };
}
