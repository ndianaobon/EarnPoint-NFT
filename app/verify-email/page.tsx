import type { Metadata } from "next";
import { VerifyEmail } from "@/components/AccountForms";

export const metadata: Metadata = { title: "Verify your email", referrer: "no-referrer" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container page">
      <VerifyEmail token={typeof token === "string" ? token : ""} />
    </div>
  );
}
