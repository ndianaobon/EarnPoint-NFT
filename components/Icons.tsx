import type { ReactNode } from "react";

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { size?: number };

export const UserIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </Icon>
);
export const PhoneIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6.6 3h2.6l1.5 4.4-2 1.6a13 13 0 0 0 6.3 6.3l1.6-2 4.4 1.5v2.6A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z" />
  </Icon>
);
export const MailIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7.5l8 6 8-6" />
  </Icon>
);
export const LockIcon = (p: P) => (
  <Icon {...p}>
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2" />
  </Icon>
);
export const EyeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const EyeOffIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.6-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
);
export const TicketIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 0 0 3V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a1.5 1.5 0 0 0 0-3z" />
    <path d="M14 6v2M14 11v2M14 16v2" />
  </Icon>
);

function BrandIcon({ path, size = 28 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export const AppleIcon = (p: P) => (
  <BrandIcon
    {...p}
    path="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
  />
);
export const GooglePlayIcon = (p: P) => (
  <BrandIcon
    {...p}
    path="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"
  />
);
export const AndroidIcon = (p: P) => (
  <BrandIcon
    {...p}
    path="M17.523 15.341a1 1 0 110-2 1 1 0 010 2m-11.046 0a1 1 0 110-2 1 1 0 010 2m11.405-6.02l1.997-3.459a.416.416 0 00-.72-.416l-2.022 3.503C15.59 8.244 13.853 7.851 12 7.851s-3.59.393-5.137 1.098L4.841 5.446a.416.416 0 00-.72.416l1.997 3.459C2.689 11.186.343 14.659 0 18.761h24c-.343-4.102-2.689-7.575-6.118-9.44"
  />
);

export const SunIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);
export const MoonIcon = (p: P) => (
  <Icon {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Icon>
);
export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const ArrowIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const BackIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const GiftIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v9h14v-9M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5h4zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5h-4z" />
  </Icon>
);
export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);
export const LayersIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />
  </Icon>
);
export const WalletIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <path d="M16 13h2M3 10h18" />
  </Icon>
);
export const InfoIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);
export const CheckBadgeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 2l10 10-10 10L2 12z" />
    <path d="M8.5 12l2.5 2.5 4.5-4.5" />
  </Icon>
);
export const ClockIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
