"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      // First: check URL hash for implicit flow tokens (access_token + type=recovery)
      const hash = window.location.hash;
      if (hash.includes("type=recovery") && hash.includes("access_token")) {
        // Supabase processes the hash automatically, session should be set
        // Wait a moment for Supabase to process
        await new Promise((r) => setTimeout(r, 500));
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Check URL query params for PKCE flow (code + type=recovery)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const type = params.get("type");
      if (code && type === "recovery") {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("Invalid or expired reset link. Please request a new one.");
          setValidSession(false);
          return;
        }
        // Clean up URL
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Now check if we have a valid session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
        setValidSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    toast.success("Password updated successfully");
  }

  if (validSession === null) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto" />
        <p className="text-sm text-muted-foreground mt-4">Verifying reset link...</p>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="border border-border p-8">
          <p className="text-sm text-destructive mb-6">{error}</p>
          <Link href="/">
            <Button className="w-full h-11 bg-primary text-primary-foreground">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="border border-border p-8">
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link href="/">
            <Button className="w-full h-11 bg-primary text-primary-foreground">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="border border-border p-8">
        <p className="text-sm text-muted-foreground mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="h-11"
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
