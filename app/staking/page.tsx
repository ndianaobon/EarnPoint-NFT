import type { Metadata } from "next";
import { LayersIcon } from "@/components/Icons";
import { PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Staking" };

const DETAILS = [
  "Supported assets and minimum and maximum amounts",
  "Duration, lock-up period and maturity date",
  "How rewards are generated and calculated",
  "Early withdrawal conditions and fees",
  "The risks of taking part",
];

export default function StakingPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Staking" title="Staking programs">
        Programs open only after their reward source, custody and legal position have been reviewed.
      </PageHead>

      <div className="empty" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
        <LayersIcon size={30} />
        <h3>No staking programs are available</h3>
        <p>Nothing can be staked yet, and no rewards are being offered or promised.</p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>What every program will disclose</h2>
          <ul className="list-plain">
            {DETAILS.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
        <div className="panel">
          <h2>Your staking summary</h2>
          <p className="muted">Your positions will appear here after you sign in, once programs are open.</p>
          <div className="network-row"><span>Active positions</span><strong>—</strong></div>
          <div className="network-row"><span>Accrued rewards</span><strong>—</strong></div>
          <div className="network-row"><span>Next maturity date</span><strong>—</strong></div>
        </div>
      </div>
    </div>
  );
}
