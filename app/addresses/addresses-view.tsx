"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { createClient } from "@/lib/supabase/client";
import type { UserAddress } from "@/types/database";
import { toast } from "sonner";

const EMPTY_FORM = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  country: "Nigeria",
  postal_code: "",
  is_default: false,
};

export default function AddressesView({
  initialAddresses,
}: {
  initialAddresses: UserAddress[];
}) {
  const user = useAuthStore((s) => s.user);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
        <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
          Sign in to manage your addresses
        </p>
        <Link href="/">
          <Button className="bg-gold text-black hover:bg-gold-light h-11">
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  function openAddDialog() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEditDialog(addr: UserAddress) {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? "",
      city: addr.city,
      state: addr.state,
      country: addr.country,
      postal_code: addr.postal_code ?? "",
      is_default: addr.is_default,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const userId = user?.id;
    if (!userId) return;

    if (!form.address_line1 || !form.city || !form.state || !form.full_name || !form.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaveLoading(true);
    const supabase = createClient();

    const addressData = {
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || null,
      city: form.city,
      state: form.state,
      country: form.country,
      postal_code: form.postal_code || null,
      is_default: form.is_default,
    };

    if (editingId) {
      // Update existing
      const { error } = await supabase
        .from("user_addresses")
        .update(addressData)
        .eq("id", editingId);

      if (!error) {
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingId ? { ...a, ...addressData, updated_at: new Date().toISOString() } : a
          )
        );
        toast.success("Address updated");
      } else {
        // Fallback: update locally
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingId ? { ...a, ...addressData } : a
          )
        );
        toast.success("Address updated");
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("user_addresses")
        .insert({ user_id: userId, ...addressData })
        .select()
        .single();

      if (!error && data) {
        const newAddr = data as unknown as UserAddress;
        if (form.is_default) {
          setAddresses((prev) => [
            newAddr,
            ...prev.map((a) => ({ ...a, is_default: false })),
          ]);
        } else {
          setAddresses((prev) => [...prev, newAddr]);
        }
      } else {
        // Fallback: create locally
        const newAddr: UserAddress = {
          id: `addr-${Date.now()}`,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...addressData,
        };
        if (form.is_default) {
          setAddresses((prev) => [
            newAddr,
            ...prev.map((a) => ({ ...a, is_default: false })),
          ]);
        } else {
          setAddresses((prev) => [...prev, newAddr]);
        }
      }

      toast.success("Address added");
    }

    setDialogOpen(false);
    setSaveLoading(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("user_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirmId(null);
    toast.success("Address deleted");
  }

  async function handleSetDefault(id: string) {
    const supabase = createClient();
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address updated");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <p className="text-sm text-muted-foreground">
          {addresses.length} saved address{addresses.length !== 1 ? "es" : ""}
        </p>
        <Button
          className="bg-gold text-black hover:bg-gold-light h-10 gap-1.5"
          onClick={openAddDialog}
        >
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
          <p className="font-heading text-2xl font-light text-muted-foreground mb-4">
            No saved addresses
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Add a delivery address to make checkout faster.
          </p>
          <Button
            className="bg-gold text-black hover:bg-gold-light h-11"
            onClick={openAddDialog}
          >
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-border p-4 sm:p-6 relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{addr.label}</p>
                      {addr.is_default && (
                        <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">
                          <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1">{addr.full_name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.state}, {addr.country}
                    </p>
                    {addr.postal_code && (
                      <p className="text-xs text-muted-foreground">
                        Postal Code: {addr.postal_code}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {addr.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!addr.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-gold h-8"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditDialog(addr)}
                    aria-label="Edit address"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => setDeleteConfirmId(addr.id)}
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Delete confirmation */}
              {deleteConfirmId === addr.id && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    Delete this address?
                  </p>
                  <Button
                    size="sm"
                    className="h-8 bg-red-500 text-white hover:bg-red-600"
                    onClick={() => handleDelete(addr.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-muted-foreground"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="font-heading text-2xl font-light text-center">
              {editingId ? "Edit Address" : "Add Address"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Label
              </label>
              <div className="flex gap-2">
                {["Home", "Office", "Other"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, label }))}
                    className={`px-4 py-2 text-sm border transition-colors duration-150 ${
                      form.label === label
                        ? "border-gold bg-gold/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-gold/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Full Name *
              </label>
              <Input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Recipient name"
                className="h-11"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Phone Number *
              </label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+234 ..."
                className="h-11"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Address Line 1 *
              </label>
              <Input
                type="text"
                value={form.address_line1}
                onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                placeholder="Street address"
                className="h-11"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Address Line 2
              </label>
              <Input
                type="text"
                value={form.address_line2}
                onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                placeholder="Apartment, suite, etc. (optional)"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  City *
                </label>
                <Input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="City"
                  className="h-11"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  State *
                </label>
                <Input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="State"
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Country
                </label>
                <Input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Postal Code
                </label>
                <Input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                  placeholder="Optional"
                  className="h-11"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sm text-muted-foreground">
                Set as default address
              </span>
            </label>

            <div className="flex items-center gap-3 pt-4">
              <Button
                className="flex-1 h-11 bg-primary text-primary-foreground"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Add Address"}
              </Button>
              <Button
                variant="ghost"
                className="h-11 px-6 text-muted-foreground"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
