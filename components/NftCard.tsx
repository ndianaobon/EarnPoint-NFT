import Link from "next/link";
import { formatPrice, type Nft } from "@/lib/nfts";
import { NftArt } from "./NftArt";

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Link href={`/nft/${nft.id}`} className="nft-card">
      <div className="nft-card-art">
        <NftArt kind={nft.art} label={nft.name} image={nft.image} />
        <span className="chip chip-sample">{nft.priceUsdt === null ? "Preview" : "Sample"}</span>
      </div>
      <div className="nft-card-body">
        <h3>{nft.name}</h3>
        <p className="muted small">{nft.collection} · {nft.token}</p>
        <div className="nft-card-foot">
          <strong>{formatPrice(nft)}</strong>
          {nft.chain && <span className="muted small">{nft.chain}</span>}
        </div>
      </div>
    </Link>
  );
}
