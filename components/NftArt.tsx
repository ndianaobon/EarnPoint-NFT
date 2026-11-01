import Image from "next/image";
import { useId, type CSSProperties } from "react";
import type { ArtKind, NftImage } from "@/lib/nfts";

const STARS = [
  [34, 48], [82, 120], [140, 30], [212, 70], [305, 42], [362, 96], [48, 210],
  [352, 190], [24, 330], [110, 372], [296, 356], [374, 318], [190, 22], [260, 150],
];

function Stars({ opacity = 0.8 }: { opacity?: number }) {
  return (
    <g fill="#fff" opacity={opacity}>
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.1} />
      ))}
    </g>
  );
}

function Flow({ id }: { id: string }) {
  const lines = Array.from({ length: 32 }, (_, i) => {
    const offset = i * 9;
    let d = "";
    for (let x = -10; x <= 410; x += 20) {
      const y =
        70 + offset + Math.sin(x / 62 + i * 0.09) * (44 + i * 1.6) + Math.cos(x / 110) * 18;
      d += `${x === -10 ? "M" : "L"}${x} ${y.toFixed(1)} `;
    }
    return d;
  });
  return (
    <>
      <defs>
        <linearGradient id={`${id}l`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3FE7C9" />
          <stop offset="0.55" stopColor="#6C8BFF" />
          <stop offset="1" stopColor="#A05CFF" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#0B0F24" />
      <g fill="none" stroke={`url(#${id}l)`} strokeWidth="1.3" opacity="0.92">
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </>
  );
}

function Fox({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#7D6BB4" />
          <stop offset="1" stopColor="#EE7A5C" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}b)`} />
      <polygon points="104,48 192,172 92,196" fill="#F08A3C" />
      <polygon points="116,84 170,166 108,178" fill="#4C2B4E" />
      <polygon points="296,48 308,196 208,172" fill="#E8722E" />
      <polygon points="284,84 292,178 230,166" fill="#4C2B4E" />
      <polygon points="92,196 192,172 200,256 78,246" fill="#F59A45" />
      <polygon points="308,196 208,172 200,256 322,246" fill="#E2682A" />
      <polygon points="192,172 208,172 200,256" fill="#CF541D" />
      <polygon points="78,246 166,262 200,364 110,312" fill="#FFF6EE" />
      <polygon points="322,246 234,262 200,364 290,312" fill="#E9DCD4" />
      <polygon points="200,256 234,262 200,364 166,262" fill="#F7B672" />
      <polygon points="182,336 218,336 200,368" fill="#21132F" />
      <polygon points="132,232 172,240 144,252" fill="#1B1238" />
      <polygon points="268,232 228,240 256,252" fill="#1B1238" />
      <circle cx="150" cy="241" r="2.6" fill="#3FE7C9" />
      <circle cx="250" cy="241" r="2.6" fill="#3FE7C9" />
    </>
  );
}

function Astronaut({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}v`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3B62FF" />
          <stop offset="0.6" stopColor="#7B3FF2" />
          <stop offset="1" stopColor="#D63FE8" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#EDEBFA" />
          <stop offset="1" stopColor="#9C9ABB" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#0C1430" />
      <Stars />
      <circle cx="310" cy="96" r="40" fill="#D65FC0" />
      <circle cx="298" cy="86" r="36" fill="#231A4B" />
      <path d="M86 400c0-74 44-118 114-118s114 44 114 118z" fill={`url(#${id}s)`} />
      <rect x="166" y="316" width="68" height="44" rx="8" fill="#34325C" />
      <circle cx="184" cy="338" r="6" fill="#F0A24A" />
      <circle cx="210" cy="338" r="6" fill="#3FE7C9" />
      <line x1="200" y1="96" x2="200" y2="58" stroke="#B9B7D6" strokeWidth="5" />
      <circle cx="200" cy="50" r="11" fill="#3FE7C9" />
      <circle cx="200" cy="184" r="92" fill={`url(#${id}s)`} />
      <rect x="126" y="150" width="148" height="76" rx="36" fill={`url(#${id}v)`} />
      <polygon points="226,172 244,188 226,204 208,188" fill="#fff" />
      <rect x="282" y="172" width="16" height="42" rx="8" fill="#8D8BAE" />
      <rect x="102" y="172" width="16" height="42" rx="8" fill="#8D8BAE" />
    </>
  );
}

function Planet({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}p`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FF9BE4" />
          <stop offset="0.55" stopColor="#D63FE8" />
          <stop offset="1" stopColor="#4A1E9E" />
        </radialGradient>
        <linearGradient id={`${id}r`} x1="0" x2="1">
          <stop offset="0" stopColor="#F4D28A" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#F4D28A" />
          <stop offset="1" stopColor="#D4A85A" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#190B36" />
      <Stars />
      <circle cx="312" cy="82" r="13" fill="#3FE7C9" />
      <circle cx="190" cy="214" r="112" fill={`url(#${id}p)`} />
      <g fill="none" stroke="#fff" opacity="0.25" strokeWidth="5">
        <path d="M90 180c60 22 130 22 196-8" />
        <path d="M80 232c70 22 150 20 220-12" />
      </g>
      <ellipse
        cx="190"
        cy="222"
        rx="178"
        ry="36"
        transform="rotate(-10 190 222)"
        fill="none"
        stroke={`url(#${id}r)`}
        strokeWidth="9"
      />
    </>
  );
}

function Prism({ id }: { id: string }) {
  const layers = [170, 142, 114, 86, 58, 30];
  return (
    <>
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#3B62FF" />
          <stop offset="0.5" stopColor="#6C4BFF" />
          <stop offset="1" stopColor="#3FE7C9" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#0A0A24" />
      <Stars opacity={0.5} />
      {layers.map((r, i) => (
        <polygon
          key={r}
          points={`200,${212 - r} ${200 + r},${212 + r * 0.72} ${200 - r},${212 + r * 0.72}`}
          fill={i === layers.length - 1 ? "#fff" : `url(#${id}g)`}
          fillOpacity={i === layers.length - 1 ? 1 : 0.16 + i * 0.07}
          stroke={`url(#${id}g)`}
          strokeWidth="1.5"
        />
      ))}
    </>
  );
}

function Orbit({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}o`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#D63FE8" />
          <stop offset="1" stopColor="#6C8BFF" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#120B30" />
      <Stars opacity={0.6} />
      <g fill="none" stroke={`url(#${id}o)`} strokeWidth="2" opacity="0.9">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="200"
            rx="150"
            ry="56"
            transform={`rotate(${i * 15} 200 200)`}
          />
        ))}
      </g>
      <circle cx="200" cy="200" r="20" fill="#3FE7C9" />
      <circle cx="200" cy="200" r="36" fill="#3FE7C9" opacity="0.18" />
    </>
  );
}

function Lattice() {
  const points: [number, number][] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 7; col++) {
      points.push([col * 62 + (row % 2 ? 31 : 0) + 12, row * 54 + 12]);
    }
  }
  return (
    <>
      <rect width="400" height="400" fill="#061A22" />
      <g stroke="#3FE7C9" strokeOpacity="0.4" strokeWidth="1.5">
        {points.flatMap(([x, y], i) => [
          <line key={`a${i}`} x1={x} y1={y} x2={x + 62} y2={y} />,
          <line key={`b${i}`} x1={x} y1={y} x2={x + 31} y2={y + 54} />,
          <line key={`c${i}`} x1={x} y1={y} x2={x - 31} y2={y + 54} />,
        ])}
      </g>
      <g fill="#3FE7C9">
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 6 : 3} />
        ))}
      </g>
    </>
  );
}

export function NftArt({
  kind,
  label,
  image,
  sizes = "(max-width: 560px) 50vw, (max-width: 1100px) 45vw, 400px",
  eager = false,
}: {
  kind: ArtKind;
  label: string;
  image?: NftImage;
  sizes?: string;
  eager?: boolean;
}) {
  const id = `art${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  if (image) {
    return (
      <Image
        className="art art-photo"
        src={image.src}
        width={image.width}
        height={image.height}
        alt={label}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        style={{ objectPosition: image.focus, "--ratio": `${image.width} / ${image.height}` } as CSSProperties}
      />
    );
  }

  if (kind === "gem") {
    return (
      <div className="art art-gem" role="img" aria-label={label}>
        {/* The approved brand kit file, used unaltered as the kit requires. */}
        <img src="/brand/gem.svg" alt="" />
      </div>
    );
  }

  return (
    <svg className="art" viewBox="0 0 400 400" role="img" aria-label={label}>
      {kind === "flow" && <Flow id={id} />}
      {kind === "fox" && <Fox id={id} />}
      {kind === "astronaut" && <Astronaut id={id} />}
      {kind === "planet" && <Planet id={id} />}
      {kind === "prism" && <Prism id={id} />}
      {kind === "orbit" && <Orbit id={id} />}
      {kind === "lattice" && <Lattice />}
    </svg>
  );
}
