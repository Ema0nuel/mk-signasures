"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
        Redirecting...
      </p>
      <h1 className="font-heading text-6xl sm:text-7xl font-light mb-4">404</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
    </div>
  );
}
