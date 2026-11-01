import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="container page">
      <PageHead eyebrow="Support" title="How can we help?">
        Start with the common questions below. Support requests will open from your account at launch.
      </PageHead>
      <Faq />
    </div>
  );
}
