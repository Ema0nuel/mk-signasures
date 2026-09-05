"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  LogOut,
  Package,
  MapPin,
  User as UserIcon,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { useCartDrawer } from "@/components/cart/cart-drawer-provider";
import { createClient } from "@/lib/supabase/client";

const SHOP_CATEGORIES = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=wigs", label: "Wigs" },
  { href: "/shop?category=hair-extensions", label: "Hair Extensions" },
  { href: "/shop?category=clothing", label: "Clothing" },
  { href: "/shop?category=accessories", label: "Accessories" },
  { href: "/shop?new=true", label: "New Arrivals" },
  { href: "/shop?sort=trending", label: "Recommended" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const getFullName = useAuthStore((s) => s.getFullName);
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.getItemCount());
  const { open: openAuth } = useAuthDialog();
  const { open: openCart } = useCartDrawer();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  function toggleSearch() {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery("");
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const fullName = getFullName();
  const initials = getInitials(fullName);
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Main nav row */}
      <nav className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-light tracking-wide">
          MKSGN
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}

          {/* Shop dropdown */}
          <div ref={shopRef} className="relative">
            <button
              onClick={() => setShopOpen(!shopOpen)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
            >
              Shop
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  shopOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {shopOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                {SHOP_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setShopOpen(false)}
                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-colors duration-150"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          {/* Desktop search */}
          <div className="hidden md:flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-foreground"
              aria-label="Search"
              onClick={toggleSearch}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <form
              onSubmit={handleSearch}
              className={`overflow-hidden transition-all duration-200 ease-out ${
                searchOpen ? "w-48 ml-1 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
                className="w-full h-9 px-3 text-sm bg-secondary border border-border rounded-md outline-none focus:border-gold transition-colors duration-150"
              />
            </form>
          </div>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-foreground md:hidden"
            aria-label="Search"
            onClick={toggleSearch}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <Link
            href="/wishlist"
            className="h-11 w-11 inline-flex items-center justify-center text-foreground relative rounded-lg hover:bg-muted transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {mounted && wishlistCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-gold text-black text-xs font-medium px-1 flex items-center justify-center">
                {wishlistCount}
              </Badge>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-foreground relative"
            aria-label="Cart"
            onClick={openCart}
          >
            <ShoppingBag className="h-5 w-5" />
            {mounted && cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-gold text-black text-xs font-medium px-1 flex items-center justify-center">
                {cartCount}
              </Badge>
            )}
          </Button>

          {/* User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-foreground"
                    aria-label="Account"
                  />
                }
              >
                {avatarUrl ? (
                  <Avatar size="sm">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-gold/10 text-gold text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-gold">{initials}</span>
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" className="flex items-center gap-2 cursor-pointer" />}>
                  <UserIcon className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/orders" className="flex items-center gap-2 cursor-pointer" />}>
                  <Package className="h-4 w-4" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/wishlist" className="flex items-center gap-2 cursor-pointer" />}>
                  <Heart className="h-4 w-4" />
                  Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/addresses" className="flex items-center gap-2 cursor-pointer" />}>
                  <MapPin className="h-4 w-4" />
                  Addresses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-foreground"
              aria-label="Sign In"
              onClick={openAuth}
            >
              <User className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-foreground md:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile search bar - slides down smoothly */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out border-b border-border ${
          searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0 border-b-0"
        }`}
      >
        <form
          onSubmit={handleSearch}
          className="px-4 py-3"
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary border border-border rounded-xl outline-none focus:border-gold transition-colors duration-150"
            autoFocus={searchOpen}
          />
        </form>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="font-heading text-lg font-light">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col px-6 py-4 gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm text-foreground hover:text-gold transition-colors duration-150 border-b border-border"
            >
              Home
            </Link>
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">Shop</p>
              <div className="flex flex-col pl-2 gap-1">
                {SHOP_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm text-muted-foreground hover:text-gold transition-colors duration-150"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {user && (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm text-foreground hover:text-gold transition-colors duration-150 border-b border-border"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm text-foreground hover:text-gold transition-colors duration-150 border-b border-border"
                  >
                    Orders
                  </Link>
                  <Button
                    variant="ghost"
                    className="justify-start py-3 h-auto text-sm text-foreground hover:text-gold"
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
