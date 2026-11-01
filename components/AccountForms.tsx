"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Field } from "./AuthForm";
import { LockIcon, MailIcon } from "./Icons";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState(token ? "" : "This link is missing its token. Please use the link from your email.");

  // Needs a click, because email scanners open links and would use up the token.
  const verify = async () => {
    setState("busy");
    setError("");
    try {
      await api("/auth/verify-email", "POST", { token });
      setState("done");
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  };

  return (
    <div className="panel auth-card">
      <h1>{state === "done" ? "Email verified" : "Verify your email"}</h1>
      {state === "done" ? (
        <>
          <p className="muted">Your account is active. You can log in now.</p>
          <Link href="/login" className="btn btn-primary btn-block card-action">Log in</Link>
        </>
      ) : (
        <>
          <p className="muted">Confirm this email address to activate your account.</p>
          {error && <p className="form-error card-action" role="alert">{error}</p>}
          <button type="button" className="btn btn-primary btn-block card-action" onClick={verify} disabled={!token || state === "busy"}>
            {state === "busy" ? "Verifying..." : "Verify my email"}
          </button>
        </>
      )}
    </div>
  );
}

export function ForgotPassword() {
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/auth/forgot-password", "POST", { email });
      setSentTo(email);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel auth-card">
      <h1>Reset your password</h1>
      {sentTo ? (
        <p className="muted">
          If <strong>{sentTo}</strong> has an account, a reset link is on its way. It lasts one hour.
        </p>
      ) : (
        <>
          <p className="muted">Enter your email and we'll send you a reset link.</p>
          <form className="auth-form-single" onSubmit={onSubmit} noValidate>
            <Field name="email" label="Email" icon={<MailIcon />} error={error} type="email" autoComplete="email" />
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <p className="auth-alt"><Link href="/login">Back to log in</Link></p>
    </div>
  );
}

export function ResetPassword({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(token ? "" : "This link is missing its token. Please request a new one.");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const next: Record<string, string> = {};
    if (password.length < 12) next.password = "Use at least 12 characters.";
    if (password !== data.get("confirm")) next.confirm = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setFormError("");
    try {
      await api("/auth/reset-password", "POST", { token, password });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields.password) setErrors({ password: err.fields.password });
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel auth-card">
      <h1>{done ? "Password changed" : "Choose a new password"}</h1>
      {done ? (
        <>
          <p className="muted">All your devices have been logged out. Log in with your new password.</p>
          <Link href="/login" className="btn btn-primary btn-block card-action">Log in</Link>
        </>
      ) : (
        <form className="auth-form-single" onSubmit={onSubmit} noValidate>
          <Field name="password" label="New password" icon={<LockIcon />} error={errors.password} hint="At least 12 characters." type="password" autoComplete="new-password" />
          <Field name="confirm" label="Confirm new password" icon={<LockIcon />} error={errors.confirm} type="password" autoComplete="new-password" />
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !token}>
            {busy ? "Saving..." : "Change password"}
          </button>
        </form>
      )}
    </div>
  );
}
