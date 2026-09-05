"use client";

import { Menu } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="p-1.5 text-muted-foreground hover:text-foreground md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">
            Admin
          </p>
          <p className="text-xs text-muted-foreground leading-tight">
            Administrator
          </p>
        </div>
        <div className="w-8 h-8 bg-gold/10 border border-border flex items-center justify-center">
          <span className="text-sm font-medium text-gold">A</span>
        </div>
      </div>
    </header>
  );
}
