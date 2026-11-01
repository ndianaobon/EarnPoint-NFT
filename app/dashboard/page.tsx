import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Dashboard" };

const FUNDS = ["Total balance", "Available USDT", "Reserved balance", "Pending deposits and withdrawals"];
const NFT_STATS = ["Owned NFTs", "Active listings", "Realized profit and loss", "Estimated portfolio value"];
const REWARDS = ["Daily points", "Staking rewards", "Referral rewards", "Airdrops joined"];

function Stats({ items }: { items: string[] }) {
  return (
    <div className="grid-4">
      {items.map((label) => (
        <div className="panel stat" key={label}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">—</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Your account" title="Dashboard">
        Your money, NFTs and rewards, each shown separately.
      </PageHead>
      <Notice>
        Accounts aren't connected yet, so nothing is shown here. This page shows how your dashboard
        will be organized.
      </Notice>

      <div className="stack">
        <section>
          <h2 className="group-title">Funds</h2>
          <Stats items={FUNDS} />
        </section>
        <section>
          <h2 className="group-title">NFTs <span className="chip chip-warn">Values are estimates</span></h2>
          <Stats items={NFT_STATS} />
        </section>
        <section>
          <h2 className="group-title">Rewards <span className="chip">Not USDT</span></h2>
          <Stats items={REWARDS} />
        </section>

        <div className="grid-2">
          <section className="panel">
            <h2>Deposit USDT</h2>
            <p className="muted">Your deposit address will appear here. Only send USDT on the network you choose.</p>
            <div className="network-row"><span>USDT on TRON</span><span className="chip">TRC20</span></div>
            <div className="network-row"><span>USDT on BNB Smart Chain</span><span className="chip">BEP20</span></div>
            <p className="notice small" style={{ marginBlock: "12px 0" }}>
              Funds sent on the wrong network may be lost. Deposits are credited only after
              blockchain confirmation.
            </p>
          </section>
          <section className="panel">
            <h2>Withdraw USDT</h2>
            <p className="muted">Withdrawals need two-step verification and may be reviewed before they're sent.</p>
            <div className="network-row"><span>Saved addresses</span><strong>—</strong></div>
            <div className="network-row"><span>Fee and amount you'll receive</span><span className="muted small">Shown before you confirm</span></div>
            <button type="button" className="btn btn-primary btn-block" disabled style={{ marginTop: 12 }}>
              Withdrawals open at launch
            </button>
          </section>
        </div>

        <div className="auth-alt">
          <Link href="/login">Log in</Link> or <Link href="/register">create an account</Link>
        </div>
      </div>
    </div>
  );
}
