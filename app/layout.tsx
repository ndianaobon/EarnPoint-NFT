import type { Metadata, Viewport } from "next";
import { Sora, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded" });

export const metadata: Metadata = {
  title: { default: "Earn Point NFT", template: "%s | Earn Point NFT" },
  description:
    "Discover, buy and sell NFTs and join airdrops: NFT trading, digital ownership and airdrop participation in one marketplace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before the first paint so the page never flashes the wrong mode.
const themeScript = `(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${unbounded.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SessionProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
