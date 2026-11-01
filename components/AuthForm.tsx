"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type HTMLInputTypeAttribute, type ReactNode } from "react";
import { api, ApiError, errorMessage, type User } from "@/lib/api";
import {
  CheckBadgeIcon,
  EyeIcon,
  EyeOffIcon,
  GiftIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  TicketIcon,
  UserIcon,
  WalletIcon,
} from "./Icons";
import { useSession } from "./SessionProvider";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;
const PHONE = /^\+[1-9][0-9]{6,14}$/;
const REFERRAL = /^[a-zA-Z0-9]{4,20}$/;

type Errors = Record<string, string>;

function validate(data: FormData, isRegister: boolean) {
  const value = (name: string) => String(data.get(name) ?? "").trim();
  const password = String(data.get("password") ?? "");
  const errors: Errors = {};

  if (!EMAIL.test(value("email"))) errors.email = "Enter a valid email address.";

  if (!isRegister) {
    if (!password) errors.password = "Enter your password.";
    return errors;
  }

  if (!USERNAME.test(value("username"))) {
    errors.username = "Use 3 to 20 letters, numbers or underscores.";
  }
  if (!PHONE.test(value("phone").replace(/[\s()-]/g, ""))) {
    errors.phone = "Enter your phone number with its country code, like +1 555 010 0000.";
  }
  if (password.length < 12) errors.password = "Use at least 12 characters.";
  if (password !== data.get("confirm")) errors.confirm = "The passwords don't match.";
  if (value("referral") && !REFERRAL.test(value("referral"))) {
    errors.referral = "Use 4 to 20 letters or numbers.";
  }
  return errors;
}

export function Field({
  name,
  label,
  icon,
  error,
  hint,
  optional,
  type = "text",
  wide,
  action,
  ...input
}: {
  name: string;
  label: string;
  icon: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: HTMLInputTypeAttribute;
  wide?: boolean;
  action?: ReactNode;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  placeholder?: string;
  defaultValue?: string;
  maxLength?: number;
}) {
  const noteId = `${name}-note`;
  const note = error ?? hint;
  return (
    <div className={wide ? "field auth-wide" : "field"}>
      <label htmlFor={name}>
        {label} {optional && <span className="field-optional">(optional)</span>}
      </label>
      <div className="input-wrap">
        <span className="input-icon">{icon}</span>
        <input
          id={name}
          name={name}
          type={type}
          className={action ? "input has-action" : "input"}
          aria-invalid={!!error}
          aria-describedby={note ? noteId : undefined}
          {...input}
        />
        {action}
      </div>
      {note && <span id={noteId} className={error ? "form-error" : "field-hint"}>{note}</span>}
    </div>
  );
}

function ResendEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const resend = async () => {
    setState("sending");
    setError("");
    try {
      await api("/auth/resend-verification", "POST", { email });
      setState("sent");
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  };

  if (state === "sent") return <p className="status-ok">We've sent a new link to {email}.</p>;
  return (
    <>
      <button type="button" className="btn btn-ghost btn-block" onClick={resend} disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Send a new link"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}

const BENEFITS = [
  { icon: <ShieldIcon />, title: "Protected account", text: "Two-step verification for sensitive actions." },
  { icon: <WalletIcon />, title: "Clear balances", text: "USDT, points and estimates are kept separate." },
  { icon: <GiftIcon />, title: "Rewards in one place", text: "Daily points, airdrops and referrals." },
];

export function AuthForm({
  mode,
  referralCode = "",
}: {
  mode: "login" | "register";
  referralCode?: string;
}) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { user, loading, setUser } = useSession();
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const showFailure = (error: unknown) => {
    if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
      // The API calls this referralCode, and the form field is referral.
      const { referralCode: referral, ...rest } = error.fields;
      setErrors(referral ? { ...rest, referral } : rest);
      setFormError("");
    } else {
      setFormError(errorMessage(error));
    }
  };

  const finishLogin = (loggedIn: User) => {
    setUser(loggedIn);
    router.push("/dashboard");
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const invalid = validate(data, isRegister);
    setErrors(invalid);
    setFormError("");
    setUnverifiedEmail("");
    if (Object.keys(invalid).length > 0) return;

    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    setBusy(true);
    try {
      if (isRegister) {
        await api("/auth/register", "POST", {
          username: String(data.get("username")).trim(),
          phone: String(data.get("phone")),
          email,
          password,
          referralCode: String(data.get("referral") ?? "").trim() || undefined,
        });
        setRegisteredEmail(email);
      } else {
        const result = await api<{ twoFactorRequired: boolean; challengeToken?: string; user?: User }>(
          "/auth/login",
          "POST",
          { email, password },
        );
        if (result.twoFactorRequired) setChallengeToken(result.challengeToken ?? "");
        else if (result.user) finishLogin(result.user);
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(email);
      showFailure(error);
    } finally {
      setBusy(false);
    }
  };

  const onSubmitCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setFormError("");
    if (!code) {
      setErrors({ code: "Enter your code." });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await api<{ user: User }>("/auth/login/2fa", "POST", { challengeToken, code });
      finishLogin(result.user);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CHALLENGE_EXPIRED") {
        setChallengeToken("");
      }
      showFailure(error);
    } finally {
      setBusy(false);
    }
  };

  const passwordType = showPassword ? "text" : "password";

  let content: ReactNode;
  if (registeredEmail) {
    content = (
      <>
        <h1>Check your email</h1>
        <p className="muted">
          We sent a verification link to <strong>{registeredEmail}</strong>. Open it to activate your
          account. The link lasts 24 hours.
        </p>
        <div className="auth-form-single">
          <ResendEmail email={registeredEmail} />
        </div>
        <p className="auth-alt">Already verified? <Link href="/login">Log in</Link></p>
      </>
    );
  } else if (challengeToken) {
    content = (
      <>
        <h1>Two-step verification</h1>
        <p className="muted">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
        <form className="auth-form" onSubmit={onSubmitCode} noValidate>
          <Field
            name="code"
            label="Code"
            icon={<ShieldIcon />}
            error={errors.code}
            autoComplete="one-time-code"
            wide
          />
          {formError && <p className="form-error auth-wide" role="alert">{formError}</p>}
          <button className="btn btn-primary btn-block auth-wide" type="submit" disabled={busy}>
            {busy ? "Checking..." : "Verify and log in"}
          </button>
        </form>
      </>
    );
  } else {
    content = (
      <>
        <h1>{isRegister ? "Create your account" : "Log in"}</h1>
        <p className="muted">
          {isRegister ? "It only takes a minute to get started." : "Enter your details to continue."}
        </p>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {isRegister && (
            <>
              <Field
                name="username"
                label="Username"
                icon={<UserIcon />}
                error={errors.username}
                autoComplete="username"
                placeholder="your_username"
              />
              <Field
                name="phone"
                label="Phone number"
                icon={<PhoneIcon />}
                error={errors.phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Start with + and country code"
              />
            </>
          )}
          <Field
            name="email"
            label="Email"
            icon={<MailIcon />}
            error={errors.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            wide
          />
          <Field
            name="password"
            label="Password"
            icon={<LockIcon />}
            error={errors.password}
            hint={isRegister ? "At least 12 characters." : undefined}
            type={passwordType}
            autoComplete={isRegister ? "new-password" : "current-password"}
            wide={!isRegister}
            action={
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />
          {isRegister && (
            <>
              <Field
                name="confirm"
                label="Confirm password"
                icon={<CheckBadgeIcon />}
                error={errors.confirm}
                type={passwordType}
                autoComplete="new-password"
              />
              <Field
                name="referral"
                label="Referral code"
                icon={<TicketIcon />}
                error={errors.referral}
                optional
                autoComplete="off"
                placeholder="Enter a code if you have one"
                defaultValue={referralCode}
                wide
              />
            </>
          )}
          {!isRegister && (
            <p className="auth-wide forgot-link"><Link href="/forgot-password">Forgot password?</Link></p>
          )}
          {formError && <p className="form-error auth-wide" role="alert">{formError}</p>}
          {unverifiedEmail && (
            <div className="auth-wide"><ResendEmail email={unverifiedEmail} /></div>
          )}
          <button className="btn btn-primary btn-block auth-wide" type="submit" disabled={busy}>
            {busy ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="auth-alt">
          {isRegister ? (
            <>Already have an account? <Link href="/login">Log in</Link></>
          ) : (
            <>New to Earn Point NFT? <Link href="/register">Sign up</Link></>
          )}
        </p>
      </>
    );
  }

  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <img src="/brand/gem.svg" alt="" />
        <h2>{isRegister ? "Your digital ownership starts here." : "Welcome back to Earn Point NFT."}</h2>
        <ul>
          {BENEFITS.map((b) => (
            <li key={b.title}>
              <span className="auth-benefit-icon">{b.icon}</span>
              <div>
                <strong>{b.title}</strong>
                <p>{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <div className="auth-main">{content}</div>
    </div>
  );
}

