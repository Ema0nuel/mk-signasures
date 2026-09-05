"use client";

import { useState } from "react";
import { User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsView() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-light">Settings</h1>

      {/* Account Info */}
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Account Info</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@mksignasures.shop"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span>Admin</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Security</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Admin credentials are managed through environment variables.
          To change your password, update the <code className="text-xs bg-muted px-1 py-0.5">ADMIN_PASSWORD</code> value in your <code className="text-xs bg-muted px-1 py-0.5">.env.local</code> file and restart the server.
        </p>
      </div>
    </div>
  );
}
