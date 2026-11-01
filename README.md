# Earn Point NFT website

Responsive Next.js website with light and dark modes. It has no backend yet, so listings are
samples, and accounts, payments and rewards aren't connected.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Live NFT images

Copy `.env.example` to `.env.local` and add your OpenSea API key. Images then appear on Home and
Explore and refresh every 5 minutes. The key stays on the server. `OPENSEA_COLLECTIONS` chooses
which collections appear. OpenSea's terms require its written permission for commercial use, so get
that before launch.

## Where to change things

- `lib/site.ts`: navigation, FAQs and `MARKETPLACE_LIVE`. Set that flag to `true` only when real
  trading is open. It changes the hero badge to "Live, marketplace now open" and enables buy buttons.
- `lib/nfts.ts`: the sample listings, to be replaced with backend data.
- `components/NftArt.tsx`: the placeholder NFT artwork.
- `app/globals.css`: colours, spacing and responsive rules. Light and dark colours are at the top.
- `public/brand/`: logo files from the EarnPoint brand kit.
- `design/hero-reference.webp`: the original hero design.
