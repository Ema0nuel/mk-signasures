"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCategories,
  createCategory,
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
  Search,
  FolderTree,
  Plus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Category } from "@/types/database";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

function buildTree(categories: Category[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.sort_order - b.sort_order);
}

export default function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formSlugEdited, setFormSlugEdited] = useState(false);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data as Category[]);
      setLoading(false);
    });
  }, []);

  const tree = buildTree(categories);

  const filteredTree = search
    ? tree.filter(
        (cat) =>
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          cat.slug.toLowerCase().includes(search.toLowerCase()) ||
          cat.children?.some(
            (child) =>
              child.name.toLowerCase().includes(search.toLowerCase()) ||
              child.slug.toLowerCase().includes(search.toLowerCase())
          )
      )
    : tree;

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFormNameChange(value: string) {
    setFormName(value);
    if (!formSlugEdited) {
      setFormSlug(slugify(value));
    }
  }

  async function handleCreate() {
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!formSlug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    const { data, error } = await createCategory({
      name: formName.trim(),
      slug: formSlug.trim() || slugify(formName),
    });

    if (error) {
      toast.error(error);
      setSaving(false);
      return;
    }

    setCategories((prev) => [...prev, data]);
    toast.success("Category created");
    setSaving(false);
    setCreateOpen(false);
    setFormName("");
    setFormSlug("");
    setFormSlugEdited(false);
  }

  // ============================================================
  // Desktop table rows (recursive)
  // ============================================================

  function DesktopRow({
    cat,
    depth = 0,
  }: {
    cat: CategoryWithChildren;
    depth?: number;
  }) {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat.id);

    return (
      <>
        <tr
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() =>
            (window.location.href = `/admin/categories/${cat.id}`)
          }
        >
          <td className="px-4 py-3">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(cat.id, e)}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <div className="w-5" />
              )}
              <FolderTree className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium leading-tight">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
            {cat.description || "—"}
          </td>
          <td className="px-4 py-3">
            {cat.is_active ? (
              <span className="text-xs text-green-600 font-medium">
                Active
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Inactive</span>
            )}
          </td>
          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums text-right">
            {cat.sort_order}
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          cat
            .children!.sort((a, b) => a.sort_order - b.sort_order)
            .map((child) => (
              <DesktopRow key={child.id} cat={child} depth={depth + 1} />
            ))}
      </>
    );
  }

  // ============================================================
  // Mobile card rows (recursive)
  // ============================================================

  function MobileRow({
    cat,
    depth = 0,
  }: {
    cat: CategoryWithChildren;
    depth?: number;
  }) {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat.id);

    return (
      <>
        <Link
          href={`/admin/categories/${cat.id}`}
          className="block border-b border-border px-4 py-3 space-y-2 hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {hasChildren ? (
                <button
                  onClick={(e) => toggleExpand(cat.id, e)}
                  className="p-0.5 shrink-0"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <div className="w-5 shrink-0" />
              )}
              <FolderTree className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {cat.slug}
                </p>
              </div>
            </div>
          </div>
          {cat.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {cat.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span
              className={`font-medium ${
                cat.is_active ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {cat.is_active ? "Active" : "Inactive"}
            </span>
            <span className="text-muted-foreground tabular-nums">
              Order: {cat.sort_order}
            </span>
          </div>
        </Link>
        {hasChildren &&
          isExpanded &&
          cat
            .children!.sort((a, b) => a.sort_order - b.sort_order)
            .map((child) => (
              <MobileRow key={child.id} cat={child} depth={depth + 1} />
            ))}
      </>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">Categories</h1>
        <Button
          onClick={() => {
            setFormName("");
            setFormSlug("");
            setFormSlugEdited(false);
            setCreateOpen(true);
          }}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="border border-border bg-card hidden md:block">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTree.map((cat) => (
                  <DesktopRow key={cat.id} cat={cat} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="border border-border bg-card md:hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No categories found</p>
          </div>
        ) : (
          <div>
            {filteredTree.map((cat) => (
              <MobileRow key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
      )}

      {/* Quick Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreateOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="Category name"
                value={formName}
                onChange={(e) => handleFormNameChange(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Slug</label>
              <Input
                placeholder="auto-generated-from-name"
                value={formSlug}
                onChange={(e) => {
                  setFormSlug(e.target.value);
                  setFormSlugEdited(true);
                }}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setCreateOpen(false)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-primary text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
