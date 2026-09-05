import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
        Page Not Found
      </p>
      <h1 className="font-heading text-6xl sm:text-7xl font-light mb-4">404</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-11 px-8 bg-gold text-black text-sm font-medium hover:bg-gold-light transition-colors duration-150"
      >
        Back to Home
      </Link>
    </div>
  );
}
