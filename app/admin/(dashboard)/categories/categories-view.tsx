"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/app/admin/actions/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FolderTree, Plus, ChevronRight, Edit2, Trash2 } from "lucide-react";
import type { Category } from "@/types/database";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  product_count?: number;
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
          cat.children?.some((child) =>
            child.name.toLowerCase().includes(search.toLowerCase())
          )
      )
    : tree;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function CategoryRow({
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
        <tr className="hover:bg-muted/50 transition-colors">
          <td className="px-4 py-3">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 24}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(cat.id)}
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
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {cat.description
              ? cat.description.length > 60
                ? cat.description.slice(0, 60) + "..."
                : cat.description
              : "—"}
          </td>
          <td className="px-4 py-3">
            {cat.is_active ? (
              <span className="text-xs text-green-600 font-medium">Active</span>
            ) : (
              <span className="text-xs text-muted-foreground">Inactive</span>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <span className="text-xs text-muted-foreground tabular-nums">
              {cat.sort_order}
            </span>
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          cat.children!.sort((a, b) => a.sort_order - b.sort_order).map((child) => (
            <CategoryRow key={child.id} cat={child} depth={depth + 1} />
          ))}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light">Categories</h1>
        <Button className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
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
                  <CategoryRow key={cat.id} cat={cat} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
      )}
    </div>
  );
}
