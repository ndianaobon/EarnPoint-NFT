"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/site";
import { CloseIcon, MenuIcon } from "./Icons";
import { Logo } from "./Logo";
import { useSession } from "./SessionProvider";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onLogout = async () => {
    setOpen(false);
    await logout().catch(() => undefined);
    router.push("/");
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        <Logo />
        <nav className="main-nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          {user ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm hide-sm" onClick={onLogout}>Log out</button>
              <Link href="/dashboard" className="btn btn-primary btn-sm hide-sm">Dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hide-sm">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm hide-sm">Sign up</Link>
            </>
          )}
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
          <Link href="/dashboard">Dashboard</Link>
          {user && <Link href="/settings/security">Security</Link>}
          <div className="mobile-menu-actions">
            {user ? (
              <button type="button" className="btn btn-ghost auth-wide" onClick={onLogout}>Log out</button>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Log in</Link>
                <Link href="/register" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
