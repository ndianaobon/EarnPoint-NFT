import Link from "next/link";
import { MARKETPLACE_LIVE } from "@/lib/site";
import { findNft } from "@/lib/nfts";
import { ArrowIcon, CheckBadgeIcon, GiftIcon } from "./Icons";
import { NftArt } from "./NftArt";

// Same layout as the hero design: the gem stays at the centre of the fan.
const FAN = ["meta-core", "primate-spec", "genesis-gem", "gamer-primate", "re-art"];

const SPECKS = [
  [6, 8], [13, 34], [20, 16], [27, 42], [33, 6], [41, 28], [47, 44], [55, 12], [62, 36], [69, 8],
  [76, 26], [83, 40], [90, 14], [96, 32], [4, 56], [11, 74], [18, 62], [25, 88], [75, 58], [81, 84],
  [88, 66], [94, 90], [37, 58], [52, 54], [64, 60], [9, 92], [31, 76], [70, 72],
];

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="beam beam-1" />
      <div className="beam beam-2" />
      <div className="beam beam-3" />
      <svg className="specks" aria-hidden="true">
        {SPECKS.map(([x, y], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 3 === 0 ? 2.4 : 1.5} fill="currentColor" />
        ))}
      </svg>
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />

      <div className="hero-copy">
        <p className="hero-pill">
          {MARKETPLACE_LIVE ? (
            <><b>Live</b> Marketplace now open</>
          ) : (
            <><b>Preview</b> Marketplace opening soon</>
          )}
        </p>
        <h1 id="hero-title">
          The future of <span className="grad-text">digital ownership</span> starts here.
        </h1>
        <p className="hero-lead">
          Discover, buy and sell NFTs and join airdrops — <strong>NFT trading, digital ownership
          and airdrop participation</strong> in one marketplace.
        </p>
        <div className="hero-actions">
          <Link href="/explore" className="btn btn-primary btn-lg">
            Explore NFTs <ArrowIcon />
          </Link>
          <Link href="/airdrops" className="btn btn-ghost btn-lg">
            <GiftIcon /> Join airdrops
          </Link>
        </div>
      </div>

      <div className="fan-wrap" aria-hidden="true">
        <div className="fan">
          {FAN.map((id, i) => {
            const nft = findNft(id);
            if (!nft) return null;
            return (
              <div key={id} className={`fan-card fan-${i + 1}`}>
                <NftArt
                  kind={nft.art}
                  label=""
                  image={nft.image}
                  sizes="(max-width: 760px) 46vw, min(31vw, 410px)"
                  eager
                />
                <div className="fan-meta">
                  <div>
                    <h3>{nft.name}</h3>
                    <p>EARNPOINT · {nft.token}</p>
                  </div>
                  <CheckBadgeIcon />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="floor" aria-hidden="true" />
    </section>
  );
}
