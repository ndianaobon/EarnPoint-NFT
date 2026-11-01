import type { Metadata } from "next";
import { PageHead } from "@/components/Notice";
import { SecuritySettings } from "@/components/SecuritySettings";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Your account" title="Security">
        Manage two-step verification, your devices and your login history.
      </PageHead>
      <SecuritySettings />
    </div>
  );
}
