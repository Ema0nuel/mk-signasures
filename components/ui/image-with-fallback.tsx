"use client";

import { useState, useCallback, useEffect } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK_SRC = "/images/no-image.png";

export function ImageWithFallback({ onError: parentOnError, src: propSrc, ...props }: ImageProps) {
  const [src, setSrc] = useState(propSrc);

  // Sync internal state when parent changes the src prop
  useEffect(() => {
    setSrc(propSrc);
  }, [propSrc]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (src !== FALLBACK_SRC) {
      setSrc(FALLBACK_SRC);
    }
    parentOnError?.(e);
  }, [src, parentOnError]);

  return <Image {...props} src={src} onError={handleError} />;
}
