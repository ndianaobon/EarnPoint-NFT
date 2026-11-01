import type { Metadata } from "next";
import { ForgotPassword } from "@/components/AccountForms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container page">
      <ForgotPassword />
    </div>
  );
}
