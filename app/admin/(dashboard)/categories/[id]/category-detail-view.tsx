"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryProductCount,
} from "@/app/admin/actions/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  FolderTree,
  Trash2,
  Package,
} from "lucide-react";
import type { Category } from "@/types/database";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function CategoryDetailView({
  categoryId,
}: {
  categoryId: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getCategoryById(categoryId),
      getCategories(),
    ]).then(([cat, cats]) => {
      if (!cat) {
        toast.error("Category not found");
        router.push("/admin/categories");
        return;
      }
      setCategory(cat);
      setAllCategories(cats as Category[]);
      setName(cat.name);
      setSlug(cat.slug);
      setSlugEdited(true);
      setDescription(cat.description || "");
      setParentId(cat.parent_id || "");
      setSortOrder(String(cat.sort_order));
      setIsActive(cat.is_active);
      setLoading(false);
    });
  }, [categoryId, router]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  // Parent options: exclude self
  const parentOptions = allCategories.filter((c) => c.id !== categoryId);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    const { error } = await updateCategory(categoryId, {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || undefined,
      parent_id: parentId || undefined,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
    });

    if (error) {
      toast.error(error);
      setSaving(false);
      return;
    }

    toast.success("Category updated");
    setSaving(false);
    router.push("/admin/categories");
  }

  async function handleDeleteClick() {
    const count = await getCategoryProductCount(categoryId);
    setProductCount(count);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    const { error } = await deleteCategory(categoryId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Category deleted");
      router.push("/admin/categories");
    }
    setDeleteLoading(false);
    setDeleteOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse border border-border" />
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Categories
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteClick}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-sm text-destructive hover:text-destructive border border-border hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <h1 className="font-heading text-2xl font-light">Edit Category</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Basic Info</h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="Category name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug</label>
              <Input
                placeholder="auto-generated-from-name"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Settings</h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Parent Category</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                placeholder="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min="0"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium">Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`text-xs font-medium ${
                    category.is_active ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {category.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sort Order</span>
                <span className="tabular-nums">{category.sort_order}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(category.created_at).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &ldquo;{category.name}&rdquo;?
            {productCount > 0 && (
              <span className="block mt-1 text-destructive font-medium">
                This category has {productCount} product
                {productCount !== 1 ? "s" : ""}. Products will remain but lose
                their category.
              </span>
            )}
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteOpen(false)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
