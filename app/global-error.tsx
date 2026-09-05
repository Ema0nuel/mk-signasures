"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send to Sentry or similar
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
            Something went wrong
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl font-light mb-4">
            Error
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-11 px-8 bg-gold text-black text-sm font-medium hover:bg-gold-light transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
