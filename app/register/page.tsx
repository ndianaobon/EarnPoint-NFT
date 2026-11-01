import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const { ref } = await searchParams;
  return (
    <div className="container page">
      <AuthForm mode="register" referralCode={typeof ref === "string" ? ref : ""} />
    </div>
  );
}
