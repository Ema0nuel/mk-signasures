"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type AuthView = "signin" | "signup" | "forgot";

function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export default function AuthDialog() {
  const { isOpen, close } = useAuthDialog();
  const router = useRouter();

  const [view, setView] = useState<AuthView>("signin");

  // ── Sign In state ──
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState("");

  // ── Sign Up state ──
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState("");

  // ── Forgot Password state ──
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);


  // ── Handlers ──

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    if (error) {
      setSignInError(error.message);
      setSignInLoading(false);
      return;
    }

    toast.success("Signed in successfully");
    setSignInEmail("");
    setSignInPassword("");
    setSignInLoading(false);
    close();
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignUpError("");

    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Passwords do not match");
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }

    setSignUpLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          full_name: signUpName,
          phone: signUpPhone || undefined,
        },
      },
    });

    if (error) {
      setSignUpError(error.message);
      setSignUpLoading(false);
      return;
    }

    toast.success("Account created successfully");

    // Send welcome email (fire and forget)
    fetch("/api/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signUpEmail, name: signUpName }),
    }).catch(() => {});

    setSignUpName("");
    setSignUpEmail("");
    setSignUpPhone("");
    setSignUpPassword("");
    setSignUpConfirm("");
    setSignUpLoading(false);
    close();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setForgotError(error.message);
      setForgotLoading(false);
      return;
    }

    setForgotSent(true);
    setForgotLoading(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setView("signin");
      setSignInError("");
      setSignUpError("");
      setForgotError("");
      setForgotSent(false);
      setForgotEmail("");
      close();
    }
  }

  function goBack() {
    setView("signin");
    setForgotError("");
    setForgotSent(false);
    setForgotEmail("");
  }

  // ── Forgot Password View ──
  if (view === "forgot") {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="font-heading text-2xl font-light text-center">
              Reset Password
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            {forgotSent ? (
              <div className="text-center py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{forgotEmail}</span>.
                  Check your inbox and follow the link to set a new password.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 border-border text-foreground hover:bg-secondary"
                  onClick={goBack}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the email address associated with your account and we will send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="h-11"
                  />

                  {forgotError && (
                    <p className="text-sm text-destructive">{forgotError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary text-primary-foreground"
                    disabled={forgotLoading}
                  >
                    {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={goBack}
                  className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mx-auto"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Sign In / Sign Up Views ──
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-2xl font-light text-center">
            Welcome
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as AuthView)}
          className="px-6 py-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="signin"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground py-3 text-sm font-medium transition-colors"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground py-3 text-sm font-medium transition-colors"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
                className="h-11"
              />
              <PasswordInput
                value={signInPassword}
                onChange={setSignInPassword}
                placeholder="Password"
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  Forgot password?
                </button>
              </div>

              {signInError && (
                <p className="text-sm text-destructive">{signInError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground"
                disabled={signInLoading}
              >
                {signInLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                type="text"
                placeholder="Full name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                required
                className="h-11"
              />
              <Input
                type="email"
                placeholder="Email address"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                className="h-11"
              />
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={signUpPhone}
                onChange={(e) => setSignUpPhone(e.target.value)}
                className="h-11"
              />
              <PasswordInput
                value={signUpPassword}
                onChange={setSignUpPassword}
                placeholder="Password"
                required
              />
              <PasswordInput
                value={signUpConfirm}
                onChange={setSignUpConfirm}
                placeholder="Confirm password"
                required
              />

              {signUpError && (
                <p className="text-sm text-destructive">{signUpError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground"
                disabled={signUpLoading}
              >
                {signUpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
