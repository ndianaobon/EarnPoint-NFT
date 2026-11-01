import type { ReactNode } from "react";
import { ComingSoonButton } from "./ComingSoonButton";
import { AndroidIcon, AppleIcon, GooglePlayIcon } from "./Icons";

type Store = { id: string; small: string; name: string; icon: ReactNode; message: string };

const STORES: Store[] = [
  {
    id: "app-store",
    small: "Download on the",
    name: "App Store",
    icon: <AppleIcon />,
    message: "The Earn Point NFT app for iPhone isn't available yet. We're working on it.",
  },
  {
    id: "google-play",
    small: "Get it on",
    name: "Google Play",
    icon: <GooglePlayIcon />,
    message: "The Earn Point NFT app on Google Play isn't available yet. We're working on it.",
  },
  {
    id: "apk",
    small: "Download the",
    name: "Android APK",
    icon: <AndroidIcon />,
    message: "The Earn Point NFT Android APK isn't available yet. We're working on it.",
  },
];

export function AppDownloads() {
  return (
    <div className="app-downloads">
      <div>
        <h2>Get the app</h2>
        <p>Trade and track your NFTs from your phone.</p>
      </div>
      <div className="store-buttons">
        {STORES.map((store) => (
          <ComingSoonButton
            key={store.id}
            className="store-btn"
            name={store.name}
            message={store.message}
            icon={store.icon}
          >
            {store.icon}
            <span>
              <small>{store.small}</small>
              <strong>{store.name}</strong>
            </span>
          </ComingSoonButton>
        ))}
      </div>
    </div>
  );
}
