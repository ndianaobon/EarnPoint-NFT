"use client";

import { useRef, useState, type ReactNode } from "react";
import { AndroidIcon, AppleIcon, ClockIcon, CloseIcon, GooglePlayIcon } from "./Icons";

type Store = { id: string; small: string; name: string; icon: ReactNode; message: string };

const STORES: Store[] = [
  {
    id: "app-store",
    small: "Download on the",
    name: "App Store",
    icon: <AppleIcon />,
    message: "The Earn Point NFT app for iPhone isn't available yet.",
  },
  {
    id: "google-play",
    small: "Get it on",
    name: "Google Play",
    icon: <GooglePlayIcon />,
    message: "The Earn Point NFT app on Google Play isn't available yet.",
  },
  {
    id: "apk",
    small: "Download the",
    name: "Android APK",
    icon: <AndroidIcon />,
    message: "The Earn Point NFT Android APK isn't available yet.",
  },
];

export function AppDownloads() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Store | null>(null);

  const open = (store: Store) => {
    setActive(store);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  return (
    <div className="app-downloads">
      <div>
        <h2>Get the app</h2>
        <p>Trade and track your NFTs from your phone.</p>
      </div>
      <div className="store-buttons">
        {STORES.map((store) => (
          <button key={store.id} type="button" className="store-btn" onClick={() => open(store)}>
            {store.icon}
            <span>
              <small>{store.small}</small>
              <strong>{store.name}</strong>
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="soon-dialog"
        aria-labelledby="soon-title"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="soon-body">
          <button type="button" className="icon-btn soon-close" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
          <span className="soon-icon">{active?.icon}</span>
          <span className="chip soon-chip"><ClockIcon size={14} /> {active?.name}</span>
          <h2 id="soon-title">Coming soon</h2>
          <p>{active?.message} We're working on it.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={close}>Got it</button>
        </div>
      </dialog>
    </div>
  );
}
