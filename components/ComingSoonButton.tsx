"use client";

import { useRef, type ReactNode } from "react";
import { ClockIcon, CloseIcon } from "./Icons";

// For actions that need the backend. It explains what isn't open yet, and never
// pretends a purchase, claim or transfer happened.
export function ComingSoonButton({
  name,
  message,
  className = "btn btn-primary",
  icon = <ClockIcon size={30} />,
  children,
}: {
  name: string;
  message: string;
  className?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialog}
        className="soon-dialog"
        aria-label={`${name}: coming soon`}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="soon-body">
          <button type="button" className="icon-btn soon-close" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
          <span className="soon-icon">{icon}</span>
          <span className="chip soon-chip">{name}</span>
          <h2>Coming soon</h2>
          <p>{message}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={close}>Got it</button>
        </div>
      </dialog>
    </>
  );
}
