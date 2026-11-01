import type { ReactNode } from "react";
import { InfoIcon } from "./Icons";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <InfoIcon />
      <p>{children}</p>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}
