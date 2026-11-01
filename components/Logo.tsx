import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Earn Point NFT home">
      <img className="show-light" src="/brand/logo-light.svg" alt="" />
      <img className="show-dark" src="/brand/logo-dark.svg" alt="" />
    </Link>
  );
}
