import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, GiftIcon } from "@/components/Icons";
import { PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Rewards" };

export default function RewardsPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Rewards" title="Daily points and referrals">
        Points are kept separately from your USDT balance and can't be withdrawn.
      </PageHead>

      <div className="grid-2">
        <div className="panel claim">
          <GiftIcon size={28} />
          <h2>Daily reward</h2>
          <div className="stat">
            <span className="stat-label">Your points balance</span>
            <span className="stat-value">—</span>
          </div>
          <div className="stat">
            <span className="stat-label">Next claim</span>
            <span className="stat-value">—</span>
          </div>
          <button type="button" className="btn btn-primary" disabled>Claim opens at launch</button>
          <p className="muted small">Sign in to claim once a day. Each claim will be checked on our servers and recorded in your history.</p>
        </div>

        <div className="panel claim">
          <ClockIcon size={28} />
          <h2>Referral program</h2>
          <p className="muted">
            You'll get a personal link to share after signing up. A 10% reward rate is proposed, and
            the final rules will be published before the program opens.
          </p>
          <div className="network-row" style={{ width: "100%" }}><span>Invited users</span><strong>—</strong></div>
          <div className="network-row" style={{ width: "100%" }}><span>Verified referrals</span><strong>—</strong></div>
          <div className="network-row" style={{ width: "100%" }}><span>Confirmed rewards</span><strong>—</strong></div>
          <Link href="/register" className="btn btn-ghost">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
