"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Mail, Phone, Calendar, Pencil, LogOut, Eye, EyeOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function ProfileView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const getFullName = useAuthStore((s) => s.getFullName);
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Sign in to view your profile
        </p>
        <Button
          className="bg-gold text-black hover:bg-gold-light h-11"
          onClick={() => router.push("/")}
        >
          Go Home
        </Button>
      </div>
    );
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const userId = user?.id;
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setAvatarLoading(true);
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload image");
      setAvatarLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (updateError) {
      toast.error("Failed to update profile");
      setAvatarLoading(false);
      return;
    }

    if (profile) {
      setProfile({ ...profile, avatar_url: avatarUrl });
    }

    toast.success("Avatar updated");
    setAvatarLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile() {
    const userId = user?.id;
    if (!userId) return;
    setSaveLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (authError) {
      toast.error(authError.message);
      setSaveLoading(false);
      return;
    }

    if (profile) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ full_name: fullName, phone: phone || null })
        .eq("id", userId);

      if (profileError) {
        logger.error("Profile update error", { message: profileError.message });
      }

      setProfile({ ...profile, full_name: fullName, phone: phone || null });
    }

    toast.success("Profile updated");
    setEditing(false);
    setSaveLoading(false);
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
      setPasswordLoading(false);
      return;
    }

    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
    setPasswordLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCart();
    clearWishlist();
    setUser(null);
    setProfile(null);
    toast.success("Signed out");
    router.push("/");
  }

  const fullNameDisplay = getFullName();
  const email = user.email ?? "";
  const phoneDisplay = profile?.phone ?? "Not set";
  const memberSince = user.created_at ? formatDate(user.created_at) : "Unknown";
  const avatarUrl = profile?.avatar_url;
  const initials = getInitials(fullNameDisplay);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Avatar */}
      <div className="border border-border p-6 sm:p-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gold/10 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullNameDisplay}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-medium text-gold">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer"
            >
              {avatarLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{fullNameDisplay}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Click the photo to upload an avatar
            </p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="border border-border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-light">Account Details</h2>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gold hover:text-gold-dark gap-1.5"
              onClick={() => {
                setFullName(profile?.full_name ?? "");
                setPhone(profile?.phone ?? "");
                setEditing(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Full Name
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Phone Number
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 ..."
                className="h-11"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="h-11 opacity-60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed from here
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                className="bg-primary text-primary-foreground h-11 px-6"
                onClick={handleSaveProfile}
                disabled={saveLoading}
              >
                {saveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                variant="ghost"
                className="h-11 px-6 text-muted-foreground"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <User className="h-4 w-4 text-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{fullNameDisplay}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Mail className="h-4 w-4 text-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Phone className="h-4 w-4 text-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{phoneDisplay}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Calendar className="h-4 w-4 text-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">{memberSince}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="border border-border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-light">Change Password</h2>
          {!changingPassword && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gold hover:text-gold-dark gap-1.5"
              onClick={() => setChangingPassword(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Change
            </Button>
          )}
        </div>

        {changingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="New password"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground h-11 px-6"
                disabled={passwordLoading}
              >
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 px-6 text-muted-foreground"
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordError("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keep your account secure by using a strong password.
          </p>
        )}
      </div>

      {/* Sign Out */}
      <div className="border border-border p-6 sm:p-8">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-11"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
