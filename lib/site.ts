// Set to true only when real trading is open. It switches the hero badge and
// the buy buttons, so the site never claims the marketplace is live before it is.
export const MARKETPLACE_LIVE = false;

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/airdrops", label: "Airdrops" },
  { href: "/staking", label: "Staking" },
  { href: "/rewards", label: "Rewards" },
  { href: "/support", label: "Support" },
];

export const FAQS = [
  {
    q: "Is the marketplace open yet?",
    a: "Not yet. The listings you see now are samples that show how the marketplace will work. They can't be bought, and no money is taken.",
  },
  {
    q: "Which deposit networks will be supported?",
    a: "USDT on TRON (TRC20) and USDT on BNB Smart Chain (BEP20). Always send on the network shown on the deposit screen, because funds sent on the wrong network may be lost.",
  },
  {
    q: "Can I lose money trading NFTs?",
    a: "Yes. NFT prices can fall and some NFTs may not resell. Your result depends on the resale price, market demand and fees. Earn Point NFT does not promise profits.",
  },
  {
    q: "How will withdrawals be protected?",
    a: "Withdrawals will need two-step verification and may be reviewed before they are sent. You'll see the fee and the amount you'll receive before you confirm.",
  },
  {
    q: "Are reward points the same as money?",
    a: "No. Points are kept separately from your USDT balance. They can't be withdrawn unless conversion rules are published in the future.",
  },
  {
    q: "Are airdrops guaranteed?",
    a: "No. Each campaign shows whether its rewards are confirmed, estimated or subject to approval, so you can see what is certain.",
  },
];
