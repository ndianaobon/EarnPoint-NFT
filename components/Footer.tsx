import Link from "next/link";
import { AppDownloads } from "./AppDownloads";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>NFT trading, digital ownership and airdrop participation in one marketplace.</p>
        </div>
        <nav aria-label="Marketplace">
          <h2>Marketplace</h2>
          <Link href="/explore">Explore NFTs</Link>
          <Link href="/airdrops">Airdrops</Link>
          <Link href="/staking">Staking</Link>
          <Link href="/rewards">Rewards</Link>
        </nav>
        <nav aria-label="Account">
          <h2>Account</h2>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">Log in</Link>
          <Link href="/register">Sign up</Link>
          <Link href="/support">Support</Link>
        </nav>
      </div>
      <div className="container">
        <AppDownloads />
      </div>
      <div className="container footer-note">
        <p>
          NFTs and crypto assets carry risk and can lose value. Earn Point NFT does not promise
          profits or guaranteed rewards.
        </p>
        <p>© {new Date().getFullYear()} Earn Point NFT</p>
      </div>
    </footer>
  );
}
