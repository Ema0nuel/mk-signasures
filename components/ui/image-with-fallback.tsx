"use client";

import { useState, useCallback } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK_SRC = "/images/no-image.png";

export function ImageWithFallback(props: ImageProps) {
  const [src, setSrc] = useState(props.src);

  const handleError = useCallback(() => {
    if (src !== FALLBACK_SRC) {
      setSrc(FALLBACK_SRC);
    }
  }, [src]);

  return <Image {...props} src={src} onError={handleError} />;
}
