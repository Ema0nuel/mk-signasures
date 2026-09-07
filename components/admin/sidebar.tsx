"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Paintbrush,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { adminLogout } from "@/app/admin/actions/auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Customization", href: "/customization", icon: Paintbrush },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Detect subdomain: admin subdomain uses bare paths (/dashboard),
  // main domain uses /admin/dashboard paths.
  const isSubdomain =
    typeof window !== "undefined" &&
    window.location.hostname.startsWith("admin.");
  const hrefPrefix = isSubdomain ? "" : "/admin";

  // Normalize pathname: strip /admin/ prefix for consistent active state matching
  const normalizedPathname = pathname.startsWith("/admin/")
    ? pathname.slice(6)
    : pathname;

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    href: `${hrefPrefix}${item.href}`,
  }));

  async function handleSignOut() {
    await adminLogout();
    router.push(`${hrefPrefix}/login`);
    router.refresh();
  }

  function handleNavClick() {
    onMobileClose();
  }

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
      />

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border bg-card flex-col transition-all duration-200",
          "hidden md:flex",
          sidebarWidth
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={onToggle}
          onNavClick={handleNavClick}
          onSignOut={handleSignOut}
          pathname={normalizedPathname}
          navItems={navItems}
          showClose={false}
          onMobileClose={onMobileClose}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-60 border-r border-border bg-card flex-col transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          collapsed={false}
          onToggle={onToggle}
          onNavClick={handleNavClick}
          onSignOut={handleSignOut}
          pathname={normalizedPathname}
          navItems={navItems}
          showClose
          onMobileClose={onMobileClose}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
  onSignOut,
  pathname,
  navItems,
  showClose,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavClick: () => void;
  onSignOut: () => void;
  pathname: string;
  navItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  showClose: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border shrink-0">
        <div className="w-8 h-8 shrink-0 overflow-hidden">
          <ImageWithFallback
            src="/images/logo-192.png"
            alt="MK Signasures"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <span className="font-heading text-base font-medium tracking-tight text-foreground truncate">
            MK Admin
          </span>
        )}
        {showClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-0.5">
        <button
          onClick={onSignOut}
          className="flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 w-full"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Desktop collapse toggle only */}
        <button
          onClick={onToggle}
          className="hidden md:flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
