import type { Metadata } from "next";
import { ResetPassword } from "@/components/AccountForms";

export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container page">
      <ResetPassword token={typeof token === "string" ? token : ""} />
    </div>
  );
}
