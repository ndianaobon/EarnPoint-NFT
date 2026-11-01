import { getMarketNfts } from "@/lib/market";
import { ArrowIcon } from "./Icons";
import { LiveNftImage } from "./LiveNftImage";

export async function LiveNfts({ limit, soft = false }: { limit: number; soft?: boolean }) {
  const feed = await getMarketNfts(limit);

  // Visitors shouldn't see a broken section. Only the local dev server explains a missing key.
  if (feed.status !== "ok") {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <section className={soft ? "section section-soft" : "section"}>
        <div className="container">
          <div className="empty">
            <h3>Live NFT images are hidden</h3>
            <p>
              {feed.status === "not-configured"
                ? "Add OPENSEA_API_KEY to .env.local to show them. This message appears only on the local dev server."
                : "OpenSea didn't return any NFTs. Check the API key and collection names. This message appears only on the local dev server."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={soft ? "section section-soft" : "section"} aria-labelledby="live-title">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Live market data</p>
            <h2 id="live-title">NFTs on OpenSea</h2>
            <p>
              These come directly from OpenSea and open there. They aren't for sale on Earn Point NFT
              and don't imply any partnership with their creators.
            </p>
          </div>
          <a href="https://opensea.io" className="text-link" target="_blank" rel="noopener noreferrer">
            Data from OpenSea <ArrowIcon />
          </a>
        </div>
        <div className="nft-grid">
          {feed.nfts.map((nft) => (
            <a
              key={nft.key}
              href={nft.openseaUrl}
              className="nft-card"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <div className="nft-card-art">
                <LiveNftImage src={nft.imageUrl} alt={nft.name} />
                <span className="chip chip-sample">Market data</span>
              </div>
              <div className="nft-card-body">
                <h3>{nft.name}</h3>
                <p className="muted small">{nft.collection}</p>
                <div className="nft-card-foot">
                  <span className="text-link small">View on OpenSea <ArrowIcon size={16} /></span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
