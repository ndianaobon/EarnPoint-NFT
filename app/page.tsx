import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { ArrowIcon, GiftIcon, LayersIcon, ShieldIcon, UserIcon, WalletIcon } from "@/components/Icons";
import { LiveNfts } from "@/components/LiveNfts";
import { NftCard } from "@/components/NftCard";
import { FEATURED_NFTS } from "@/lib/nfts";

export const revalidate = 300;

const STEPS = [
  { icon: <UserIcon />, title: "Join", text: "Create your account and turn on two-step verification." },
  { icon: <WalletIcon />, title: "Buy and resell", text: "Add USDT, see the full cost upfront, and set your own resale price." },
  { icon: <GiftIcon />, title: "Earn rewards", text: "Collect daily points and join airdrops, with every reward clearly labelled." },
];

const FACTS = [
  { icon: <LayersIcon size={18} />, text: "USDT on TRC20 and BEP20" },
  { icon: <ShieldIcon size={18} />, text: "Two-step verification on withdrawals" },
  { icon: <WalletIcon size={18} />, text: "No promises of guaranteed profit" },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="section" aria-labelledby="art-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Earn Point Originals</p>
              <h2 id="art-title">Art worth collecting</h2>
            </div>
            <Link href="/explore" className="text-link">Explore all <ArrowIcon /></Link>
          </div>
          <div className="art-grid">
            {FEATURED_NFTS.map((nft) => (
              <NftCard key={nft.id} nft={nft} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 id="how-title">Three simple steps</h2>
            </div>
          </div>
          <div className="grid-3">
            {STEPS.map((step) => (
              <div className="panel" key={step.title}>
                <div className="step-num">{step.icon}</div>
                <h3>{step.title}</h3>
                <p className="muted">{step.text}</p>
              </div>
            ))}
          </div>
          <ul className="fact-row">
            {FACTS.map((fact) => (
              <li key={fact.text}>{fact.icon} {fact.text}</li>
            ))}
          </ul>
        </div>
      </section>

      <LiveNfts limit={4} />

      <section className="section section-soft" aria-labelledby="faq-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 id="faq-title">Common questions</h2>
            </div>
            <Link href="/support" className="text-link">All questions <ArrowIcon /></Link>
          </div>
          <Faq limit={3} />
        </div>
      </section>
    </>
  );
}
