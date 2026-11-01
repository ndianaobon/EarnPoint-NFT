"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldIcon, TicketIcon, UserIcon } from "./Icons";
import { useSession } from "./SessionProvider";

export function AccountSummary() {
  const { user, loading } = useSession();
  const [copied, setCopied] = useState(false);

  if (loading) return <div className="panel"><p className="muted">Loading your account...</p></div>;

  if (!user) {
    return (
      <div className="empty">
        <UserIcon size={30} />
        <h3>You're not logged in</h3>
        <p>Log in or create an account to see your details here.</p>
        <div className="empty-actions">
          <Link href="/login" className="btn btn-primary">Log in</Link>
          <Link href="/register" className="btn btn-ghost">Create an account</Link>
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;
  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Welcome, {user.username}</h2>
        <div className="network-row"><span>Email</span><span className="chip chip-mint">{user.email}</span></div>
        <div className="network-row">
          <span>Phone</span>
          <span>{user.phone} <span className="muted small">({user.phoneVerified ? "verified" : "not verified yet"})</span></span>
        </div>
        <div className="network-row">
          <span><ShieldIcon size={16} /> Two-step verification</span>
          <Link href="/settings/security" className="text-link small">
            {user.twoFactorEnabled ? "On, manage" : "Off, turn on"}
          </Link>
        </div>
      </section>
      <section className="panel">
        <h2><TicketIcon size={18} /> Your referral link</h2>
        <p className="muted">Share this link to invite people. Referral rewards aren't open yet, and the final rules will be published first.</p>
        <p className="referral-link">{referralLink}</p>
        <button type="button" className="btn btn-ghost card-action" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </section>
    </div>
  );
}
