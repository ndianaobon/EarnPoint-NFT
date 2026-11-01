"use client";

import { useEffect, useRef, useState } from "react";

export function LiveNftImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image can fail before React attaches onError, so check once on mount too.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return <div className="art live-fallback">Image unavailable</div>;
  }

  return (
    <img
      ref={ref}
      className="art live-image"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
