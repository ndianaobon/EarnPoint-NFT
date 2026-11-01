import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonButton } from "@/components/ComingSoonButton";
import { BackIcon, ClockIcon } from "@/components/Icons";
import { NftArt } from "@/components/NftArt";
import { NftCard } from "@/components/NftCard";
import { Notice } from "@/components/Notice";
import { findNft, formatPrice, NFTS } from "@/lib/nfts";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return NFTS.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: findNft(id)?.name ?? "NFT not found" };
}

export default async function NftPage({ params }: Props) {
  const { id } = await params;
  const nft = findNft(id);
  if (!nft) notFound();

  const related = NFTS.filter((n) => n.id !== nft.id && n.collection === nft.collection).slice(0, 4);

  return (
    <div className="container page">
      <Link href="/explore" className="back-link"><BackIcon /> Back to Explore</Link>
      <Notice>
        {nft.priceUsdt === null
          ? "This artwork is a preview. It isn't listed for sale yet."
          : "This is a sample listing for preview only. It isn't a real offer and can't be bought yet."}
      </Notice>
      <div className="detail">
        <div className="detail-art">
          <NftArt
            kind={nft.art}
            label={nft.name}
            image={nft.image}
            sizes="(max-width: 760px) 100vw, 590px"
            eager
          />
        </div>
        <div>
          <p className="eyebrow">{nft.collection}</p>
          <h1>{nft.name} {nft.token}</h1>
          <p className="detail-desc">{nft.description}</p>

          <div className="traits">
            {nft.traits.map((t) => (
              <div className="trait" key={t.label}>
                <span>{t.label}</span>
                <strong>{t.value}</strong>
              </div>
            ))}
          </div>

          <div className="panel summary">
            <h2>Cost summary</h2>
            <div className="summary-row">
              <span>{nft.priceUsdt === null ? "Price" : "Sample price"}</span>
              <span>{formatPrice(nft)}</span>
            </div>
            <div className="summary-row"><span>Blockchain</span><span>{nft.chain ?? "Confirmed at launch"}</span></div>
            <div className="summary-row"><span>Marketplace fee</span><span>Shown before you confirm</span></div>
            <div className="summary-row"><span>Creator royalty</span><span>Shown before you confirm</span></div>
            <ComingSoonButton
              className="btn btn-primary btn-block"
              name="Buying NFTs"
              message="Buying isn't open yet, so no order was placed and no money was taken."
            >
              Buy this NFT
            </ComingSoonButton>
            <p className="muted small">
              NFT prices can fall, and resale isn't guaranteed. A purchase completes only after
              payment and the ownership transfer are verified.
            </p>
          </div>
        </div>
      </div>

      <section className="section" aria-labelledby="history-title" style={{ paddingBottom: 0 }}>
        <h2 id="history-title" className="group-title">Sale history</h2>
        <div className="empty">
          <ClockIcon size={30} />
          <h3>No verified sales</h3>
          <p>Verified sales of this NFT will be listed here.</p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-title" style={{ paddingBottom: 0 }}>
          <h2 id="related-title" className="group-title">More from {nft.collection}</h2>
          <div className="nft-grid">
            {related.map((n) => <NftCard key={n.id} nft={n} />)}
          </div>
        </section>
      )}
    </div>
  );
}
