import type { Metadata } from "next";
import { GiftIcon } from "@/components/Icons";
import { PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Airdrops" };

const STATUSES = [
  { name: "Confirmed", className: "chip chip-mint", text: "The project has confirmed the reward and its amount." },
  { name: "Estimated", className: "chip chip-warn", text: "The amount may change. Treat it as a guide only." },
  { name: "Subject to approval", className: "chip chip-warn", text: "You'll receive a reward only if your entry is approved." },
];

const DETAILS = [
  "Campaign name, description and participating project",
  "Supported tokens or digital assets",
  "Eligibility criteria and required tasks",
  "Start and end dates",
  "Your participation status and claim instructions",
  "Distribution status and transaction hashes, when available",
];

export default function AirdropsPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Airdrop center" title="Airdrops">
        Find campaigns, complete their tasks and track your progress in one place.
      </PageHead>

      <div className="empty" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
        <GiftIcon size={30} />
        <h3>No campaigns are open right now</h3>
        <p>Campaigns will appear here when they're announced. Rewards aren't guaranteed unless marked confirmed.</p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>What every campaign will show</h2>
          <ul className="list-plain">
            {DETAILS.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
        <div className="panel">
          <h2>What reward labels mean</h2>
          <div className="stack" style={{ marginTop: 14 }}>
            {STATUSES.map((s) => (
              <div key={s.name}>
                <span className={s.className}>{s.name}</span>
                <p className="muted small">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
