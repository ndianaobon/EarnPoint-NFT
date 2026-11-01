export type ArtKind =
  | "gem"
  | "flow"
  | "fox"
  | "astronaut"
  | "planet"
  | "prism"
  | "orbit"
  | "lattice"
  | "image";

export type NftImage = {
  src: string;
  width: number;
  height: number;
  // Which part stays visible when a non-square image is cropped into a square card.
  focus?: string;
};

export type Nft = {
  id: string;
  name: string;
  token: string;
  collection: string;
  category: "Abstract" | "Characters" | "Space" | "Collectibles";
  chain: "Polygon" | "Base" | "Ethereum" | null;
  priceUsdt: number | null;
  art: ArtKind;
  image?: NftImage;
  hidden?: boolean;
  description: string;
  traits: { label: string; value: string }[];
};

const ORIGINALS = "Earn Point Originals";

// The brand's own artwork. Price and network stay null until each piece is really listed.
const ORIGINAL_NFTS: Nft[] = [
  {
    id: "meta-core",
    name: "Meta-Core",
    token: "#002",
    collection: ORIGINALS,
    category: "Characters",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/meta-core.jpg", width: 1024, height: 1024 },
    description:
      "A chrome skull in a beanie, data visor and headphones, standing in front of a neon city.",
    traits: [
      { label: "Style", value: "Cyberpunk" },
      { label: "Eyewear", value: "Data visor" },
      { label: "Badge", value: "DAO" },
    ],
  },
  {
    id: "gamer-primate",
    name: "Gamer Primate 2.0",
    token: "#003",
    collection: ORIGINALS,
    category: "Characters",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/gamer-primate.jpg", width: 1024, height: 683, focus: "50% 50%" },
    description:
      "A small primate in a glowing VR headset, holding a controller on a circuit-board plinth.",
    traits: [
      { label: "Style", value: "3D collectible" },
      { label: "Headset", value: "Neon VR" },
      { label: "Hands", value: "Robotic" },
    ],
  },
  {
    id: "primate-spec",
    name: "Primate Spec 1",
    token: "#004",
    collection: ORIGINALS,
    category: "Space",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/primate-spec.jpg", width: 1024, height: 1024 },
    description:
      "A violet primate with a brass eyepiece and breathing mask, armed for deep space among the asteroids.",
    traits: [
      { label: "Setting", value: "Deep space" },
      { label: "Eyepiece", value: "Brass" },
      { label: "Weapon", value: "Energy blade" },
    ],
  },
  {
    id: "re-art",
    name: "Re-Art 001",
    token: "#005",
    collection: ORIGINALS,
    category: "Characters",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/re-art.jpg", width: 689, height: 1024, focus: "50% 24%" },
    description:
      "A hooded rabbit with glowing X eyes and a gold chain, sitting on a dripping neon plinth.",
    traits: [
      { label: "Style", value: "Designer toy" },
      { label: "Eyes", value: "Neon X" },
      { label: "Chain", value: "Gold" },
    ],
  },
  {
    // Hidden until the Arasaka logo is removed from the art. To restore it, put the cleaned
    // image in public/nfts/ (the original is in design/hidden-art/) and delete this flag.
    hidden: true,
    id: "cyber-cat",
    name: "Cyber Cat",
    token: "#006",
    collection: ORIGINALS,
    category: "Characters",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/cyber-cat.jpg", width: 1024, height: 1024 },
    description:
      "An armoured cat in an orange-trimmed hood, with bright blue eyes and the Earnpoint NFT chest plate.",
    traits: [
      { label: "Style", value: "Cyberpunk" },
      { label: "Eyes", value: "Electric blue" },
      { label: "Armour", value: "Steel" },
    ],
  },
  {
    id: "primate-den",
    name: "Den of Primates",
    token: "#007",
    collection: ORIGINALS,
    category: "Characters",
    chain: null,
    priceUsdt: null,
    art: "image",
    image: { src: "/nfts/primate-den.jpg", width: 1024, height: 559, focus: "68% 50%" },
    description:
      "A gamer primate in a VR headset at a console, surrounded by screens and a live leaderboard.",
    traits: [
      { label: "Scene", value: "Gaming den" },
      { label: "Headset", value: "Black VR" },
      { label: "Hands", value: "Robotic" },
    ],
  },
];

// Sample records that show the layout. Replace with data from the backend once
// real listings exist.
const SAMPLE_NFTS: Nft[] = [
  {
    id: "genesis-gem",
    name: "Genesis Gem",
    token: "#001",
    collection: "EarnPoint Genesis",
    category: "Collectibles",
    chain: null,
    priceUsdt: null,
    art: "gem",
    description:
      "A brilliant-cut gem whose facets all meet at a single glowing point. The first piece in the EarnPoint Genesis collection.",
    traits: [
      { label: "Cut", value: "Brilliant" },
      { label: "Glow", value: "Violet and mint" },
      { label: "Edition", value: "1 of 1" },
    ],
  },
  {
    id: "ember-fox",
    name: "Ember Fox",
    token: "#021",
    collection: "Low Poly Wild",
    category: "Characters",
    chain: "Base",
    priceUsdt: 340,
    art: "fox",
    description:
      "A low-poly fox in warm sunset tones, built from simple geometric planes.",
    traits: [
      { label: "Species", value: "Fox" },
      { label: "Palette", value: "Sunset" },
      { label: "Edition", value: "1 of 50" },
    ],
  },
  {
    id: "star-drifter",
    name: "Star Drifter",
    token: "#007",
    collection: "Deep Orbit",
    category: "Space",
    chain: "Ethereum",
    priceUsdt: 780,
    art: "astronaut",
    description:
      "A lone astronaut drifting past a violet moon, with one mint antenna light still on.",
    traits: [
      { label: "Suit", value: "Silver" },
      { label: "Visor", value: "Indigo" },
      { label: "Edition", value: "1 of 25" },
    ],
  },
  {
    id: "flowfield",
    name: "Flowfield",
    token: "#034",
    collection: "Signal Lines",
    category: "Abstract",
    chain: "Polygon",
    priceUsdt: 210,
    art: "flow",
    description:
      "Thirty-two drawn lines bend together into one slow wave of teal and violet.",
    traits: [
      { label: "Style", value: "Generative" },
      { label: "Lines", value: "32" },
      { label: "Edition", value: "1 of 100" },
    ],
  },
  {
    id: "ringed-world",
    name: "Ringed World",
    token: "#013",
    collection: "Deep Orbit",
    category: "Space",
    chain: "Base",
    priceUsdt: 560,
    art: "planet",
    description:
      "A magenta gas giant wrapped in a thin golden ring, with one small mint moon nearby.",
    traits: [
      { label: "Planet", value: "Gas giant" },
      { label: "Ring", value: "Gold" },
      { label: "Edition", value: "1 of 25" },
    ],
  },
  {
    id: "prism-gate",
    name: "Prism Gate",
    token: "#042",
    collection: "Signal Lines",
    category: "Abstract",
    chain: "Ethereum",
    priceUsdt: 430,
    art: "prism",
    description:
      "Nested triangles of light that open like a doorway at the centre of the frame.",
    traits: [
      { label: "Style", value: "Geometric" },
      { label: "Layers", value: "6" },
      { label: "Edition", value: "1 of 40" },
    ],
  },
  {
    id: "orbit-bloom",
    name: "Orbit Bloom",
    token: "#056",
    collection: "Deep Orbit",
    category: "Space",
    chain: "Polygon",
    priceUsdt: 150,
    art: "orbit",
    description:
      "Overlapping orbital rings that form a flower around a small bright core.",
    traits: [
      { label: "Rings", value: "12" },
      { label: "Core", value: "Mint" },
      { label: "Edition", value: "1 of 200" },
    ],
  },
  {
    id: "mint-lattice",
    name: "Mint Lattice",
    token: "#068",
    collection: "EarnPoint Genesis",
    category: "Collectibles",
    chain: "Base",
    priceUsdt: 95,
    art: "lattice",
    description:
      "A crystal lattice seen from above, with each joint lit in Yield Mint.",
    traits: [
      { label: "Pattern", value: "Hexagonal" },
      { label: "Light", value: "Mint" },
      { label: "Edition", value: "1 of 500" },
    ],
  },
];

export const NFTS = [...ORIGINAL_NFTS, ...SAMPLE_NFTS].filter((n) => !n.hidden);
export const FEATURED_NFTS = NFTS.filter((n) => n.priceUsdt === null).sort((a, b) =>
  a.token.localeCompare(b.token),
);

export const COLLECTIONS = Array.from(new Set(NFTS.map((n) => n.collection)));
export const CATEGORIES = Array.from(new Set(NFTS.map((n) => n.category)));
export const CHAINS = Array.from(new Set(NFTS.flatMap((n) => n.chain ?? [])));

export const findNft = (id: string) => NFTS.find((n) => n.id === id);

export const formatPrice = (nft: Nft) =>
  nft.priceUsdt === null ? "Price at launch" : `${nft.priceUsdt.toLocaleString("en-US")} USDT`;
