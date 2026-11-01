"use client";

import Link from "next/link";
import { useState, type FormEvent, type HTMLInputTypeAttribute, type ReactNode } from "react";
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
import { Notice } from "./Notice";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;
const PHONE = /^\+?[0-9\s()-]+$/;
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
  const digits = value("phone").replace(/\D/g, "").length;
  if (!PHONE.test(value("phone")) || digits < 7 || digits > 15) {
    errors.phone = "Enter a valid phone number with its country code.";
  }
  if (password.length < 12) errors.password = "Use at least 12 characters.";
  if (password !== data.get("confirm")) errors.confirm = "The passwords don't match.";
  if (value("referral") && !REFERRAL.test(value("referral"))) {
    errors.referral = "Use 4 to 20 letters or numbers.";
  }
  return errors;
}

function Field({
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
  inputMode?: "text" | "tel" | "email";
  placeholder?: string;
  defaultValue?: string;
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
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // No account service is connected yet, so this checks the fields and then
  // says so. Nothing is sent or stored, and the password is never kept.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(new FormData(e.currentTarget), isRegister);
    setErrors(next);
    const valid = Object.keys(next).length === 0;
    setSent(valid);
    if (valid) e.currentTarget.reset();
  };

  const passwordType = showPassword ? "text" : "password";

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

      <div className="auth-main">
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
                placeholder="Include country code"
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
          <button className="btn btn-primary btn-block auth-wide" type="submit">
            {isRegister ? "Create account" : "Log in"}
          </button>
        </form>
        {sent && (
          <div role="status" className="auth-status">
            <Notice>
              Accounts aren't open yet, so nothing was submitted or saved. Please come back at launch.
            </Notice>
          </div>
        )}
        <p className="auth-alt">
          {isRegister ? (
            <>Already have an account? <Link href="/login">Log in</Link></>
          ) : (
            <>New to Earn Point NFT? <Link href="/register">Sign up</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
