"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, type User } from "@/lib/api";
import { Field } from "./AuthForm";
import { LockIcon, ShieldIcon } from "./Icons";
import { useSession } from "./SessionProvider";

type Session = { id: string; ip: string | null; userAgent: string | null; lastSeenAt: string; current: boolean };
type LoginEvent = { success: boolean; ip: string | null; createdAt: string };
type Setup = { secret: string; qrCode: string };

const when = (value: string) => new Date(value).toLocaleString();
const device = (agent: string | null) => (agent ? agent.slice(0, 70) : "Unknown device");

function TwoFactor({ user, refresh }: { user: User; refresh: () => Promise<void> }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [turningOff, setTurningOff] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const field = (e: FormEvent<HTMLFormElement>, name: string) =>
    String(new FormData(e.currentTarget).get(name) ?? "");

  if (codes.length > 0) {
    return (
      <section className="panel">
        <h2>Save your recovery codes</h2>
        <p className="muted">
          Two-step verification is on. Keep these codes somewhere safe. Each works once if you lose your
          phone, and they won't be shown again.
        </p>
        <ul className="recovery-codes">
          {codes.map((code) => <li key={code}>{code}</li>)}
        </ul>
        <button type="button" className="btn btn-primary" onClick={() => setCodes([])}>I've saved them</button>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Two-step verification</h2>
      <p className="muted">
        {user.twoFactorEnabled
          ? "On. You'll enter a code from your authenticator app when you log in."
          : "Off. Turn it on to protect your account even if your password is stolen."}
      </p>

      {!user.twoFactorEnabled && !setup && (
        <form
          className="auth-form-single"
          onSubmit={(e) => {
            e.preventDefault();
            const password = field(e, "setup-password");
            run(async () => setSetup(await api<Setup>("/me/2fa/setup", "POST", { password })));
          }}
        >
          <Field name="setup-password" label="Confirm your password" icon={<LockIcon />} type="password" autoComplete="current-password" />
          <button type="submit" className="btn btn-primary" disabled={busy}>Set up two-step verification</button>
        </form>
      )}

      {!user.twoFactorEnabled && setup && (
        <form
          className="auth-form-single"
          onSubmit={(e) => {
            e.preventDefault();
            const code = field(e, "enable-code").trim();
            run(async () => {
              const result = await api<{ recoveryCodes: string[] }>("/me/2fa/enable", "POST", { code });
              setCodes(result.recoveryCodes);
              setSetup(null);
              await refresh();
            });
          }}
        >
          <p className="muted">Scan this with your authenticator app, then enter the 6-digit code it shows.</p>
          <img className="qr-code" src={setup.qrCode} alt="Two-step verification QR code" width={200} height={200} />
          <p className="muted small">Can't scan it? Enter this key: <code>{setup.secret}</code></p>
          <Field name="enable-code" label="6-digit code" icon={<ShieldIcon />} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
          <button type="submit" className="btn btn-primary" disabled={busy}>Turn on</button>
        </form>
      )}

      {user.twoFactorEnabled && !turningOff && (
        <button type="button" className="btn btn-ghost card-action" onClick={() => setTurningOff(true)}>
          Turn off
        </button>
      )}

      {user.twoFactorEnabled && turningOff && (
        <form
          className="auth-form-single"
          onSubmit={(e) => {
            e.preventDefault();
            const password = field(e, "disable-password");
            const code = field(e, "disable-code").trim();
            run(async () => {
              await api("/me/2fa/disable", "POST", { password, code });
              setTurningOff(false);
              await refresh();
            });
          }}
        >
          <Field name="disable-password" label="Password" icon={<LockIcon />} type="password" autoComplete="current-password" />
          <Field name="disable-code" label="Code or recovery code" icon={<ShieldIcon />} autoComplete="one-time-code" />
          <button type="submit" className="btn btn-primary" disabled={busy}>Confirm and turn off</button>
        </form>
      )}

      {error && <p className="form-error card-action" role="alert">{error}</p>}
    </section>
  );
}

export function SecuritySettings() {
  const { user, loading, setUser } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<LoginEvent[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextSessions, nextHistory] = await Promise.all([
        api<Session[]>("/me/sessions"),
        api<LoginEvent[]>("/me/login-history"),
      ]);
      setSessions(nextSessions);
      setHistory(nextHistory);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <p className="muted">Loading...</p>;
  if (!user) {
    return (
      <div className="empty">
        <LockIcon size={30} />
        <h3>Please log in</h3>
        <p>Log in to manage your account security.</p>
        <Link href="/login" className="btn btn-primary">Log in</Link>
      </div>
    );
  }

  const revoke = async (id: string) => {
    setError("");
    try {
      await api(`/me/sessions/${id}`, "DELETE");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="stack">
      <TwoFactor
        user={user}
        refresh={async () => {
          setUser(await api<User>("/me"));
          await load();
        }}
      />

      {error && <p className="form-error" role="alert">{error}</p>}

      <section className="panel">
        <h2>Active sessions</h2>
        {sessions.map((session) => (
          <div className="network-row" key={session.id}>
            <span>
              {device(session.userAgent)}
              <span className="muted small session-meta"> Last active {when(session.lastSeenAt)}</span>
            </span>
            {session.current ? (
              <span className="chip chip-mint">This device</span>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => revoke(session.id)}>Log out</button>
            )}
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Login history</h2>
        {history.map((event) => (
          <div className="network-row" key={event.createdAt}>
            <span>{when(event.createdAt)}<span className="muted small session-meta"> {event.ip ?? "Unknown address"}</span></span>
            <span className={event.success ? "chip chip-mint" : "chip chip-warn"}>{event.success ? "Successful" : "Failed"}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
