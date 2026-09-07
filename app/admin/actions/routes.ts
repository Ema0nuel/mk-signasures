"use server";

import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

// Label map for known routes
const LABEL_MAP: Record<string, string> = {
  shop: "Shop",
  about: "About",
  contact: "Contact",
  faq: "FAQ",
  shipping: "Shipping Info",
  returns: "Returns Policy",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  cart: "Cart",
  checkout: "Checkout",
  wishlist: "Wishlist",
  profile: "Profile",
  orders: "My Orders",
  addresses: "My Addresses",
};

function slugToLabel(slug: string): string {
  if (LABEL_MAP[slug]) return LABEL_MAP[slug];
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getSiteRoutes() {
  const appDir = path.join(process.cwd(), "app");
  const routes: Array<{ label: string; href: string }> = [];

  // Always include Home and Shop All
  routes.push({ label: "Home", href: "/" });
  routes.push({ label: "Shop All", href: "/shop" });

  // Read app directory for page files
  function scanDir(dir: string, prefix: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = entry.name;

      // Skip non-page directories and special files
      if (name.startsWith("_") || name.startsWith(".")) continue;
      if (name === "admin" || name === "api" || name === "auth") continue;
      if (name.startsWith("test")) continue;

      // Skip route groups like (dashboard)
      if (name.startsWith("(")) continue;

      if (entry.isDirectory()) {
        // Check if this directory has a page.tsx
        const hasPage = entries.some(
          (e) => e.name === "page.tsx" && !entry.isDirectory()
        );

        // If it's a dynamic route like [slug], skip it
        if (name.startsWith("[")) continue;

        if (hasPage) {
          const label = slugToLabel(name);
          const href = prefix ? `${prefix}/${name}` : `/${name}`;
          // Avoid duplicating /shop which we already added
          if (href !== "/shop") {
            routes.push({ label, href });
          }
        }

        // Recurse into subdirectories
        scanDir(path.join(dir, name), prefix ? `${prefix}/${name}` : `/${name}`);
      }
    }
  }

  scanDir(appDir, "");

  // Add common shop query variants
  routes.push({ label: "New Arrivals", href: "/shop?new=true" });
  routes.push({ label: "Recommended", href: "/shop?sort=trending" });

  // Fetch categories from DB and add shop filter variants
  try {
    const supabase = await createClient();
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("name");

    if (categories) {
      for (const cat of categories) {
        routes.push({
          label: `Shop: ${cat.name}`,
          href: `/shop?category=${cat.slug}`,
        });
      }
    }
  } catch {
    // If DB fetch fails, just skip category routes
  }

  // Sort alphabetically by label, but keep Home and Shop All at top
  const pinned = routes.filter(
    (r) => r.href === "/" || r.href === "/shop"
  );
  const rest = routes
    .filter((r) => r.href !== "/" && r.href !== "/shop")
    .sort((a, b) => a.label.localeCompare(b.label));

  // Always add Custom / Other at the end
  return [...pinned, ...rest, { label: "Custom / Other", href: "__custom__" }];
}
