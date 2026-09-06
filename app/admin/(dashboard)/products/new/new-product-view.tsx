"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  Upload,
  X,
  Trash2,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
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
  createProduct,
  getCategories,
  uploadProductImageFile,
  deleteProductImage,
  setPrimaryImage,
  addProductImageByUrl,
  createVariantAttribute,
  deleteVariantAttribute,
  createVariantOption,
  deleteVariantOption,
  createProductVariant,
  deleteProductVariant,
  getProductVariantById,
} from "@/app/admin/actions/data";
import type { Category } from "@/types/database";
import { compressImage } from "@/lib/image-compress";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

type ImageData = {
  id: string;
  original_url: string;
  optimized_url: string | null;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
  processing_status: string;
};

type AttributeData = {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  variant_options: {
    id: string;
    value: string;
    display_value: string | null;
    sort_order: number;
  }[];
};

type VariantData = {
  id: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  weight_grams: number | null;
  barcode: string | null;
  product_variant_selections: {
    id: string;
    variant_option_id: string;
    variant_options: {
      id: string;
      value: string;
      display_value: string | null;
      variant_attributes: {
        display_name: string;
      };
    };
  }[];
};

export default function NewProductView() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  // Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [tags, setTags] = useState("");

  // Images
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);

  // Variants
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrDisplayName, setNewAttrDisplayName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  const [expandedAttrs, setExpandedAttrs] = useState<Set<string>>(new Set());
  const [showSkuForm, setShowSkuForm] = useState(false);
  const [skuForm, setSkuForm] = useState({
    sku: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "",
    weight_grams: "",
    barcode: "",
    option_selections: {} as Record<string, string>,
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "image" | "attribute" | "option" | "variant";
    id: string;
    label: string;
    extra?: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getCategories().then((data) => setCategories(data as Category[]));
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  // ============================================================
  // Create product (step 1)
  // ============================================================

  async function handleCreateProduct() {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    setLoading(true);

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await createProduct({
      name: name.trim(),
      slug: slug || slugify(name),
      description: description.trim() || undefined,
      short_description: shortDescription.trim() || undefined,
      category_id: categoryId,
      base_price: Number(basePrice),
      status,
      is_featured: isFeatured,
      tags: tagArray.length > 0 ? tagArray : undefined,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    setCreated(data.id);
    toast.success("Product created. Now add images and variants.");
    setLoading(false);
  }

  // ============================================================
  // Image handling
  // ============================================================

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!created) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: file too large (max 50MB)`);
        continue;
      }

      // Compress before upload (Canvas API, no dependencies)
      const compressed = await compressImage(file);

      const arrayBuffer = await compressed.blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const { data: imageData, error: insertError } = await uploadProductImageFile(
        created,
        base64,
        compressed.fileName,
        compressed.mimeType,
        file.name.replace(/\.[^.]+$/, ""),
        false
      );

      if (insertError) {
        toast.error(`Upload failed: ${insertError}`);
        continue;
      }

      setImages((prev) => [...prev, imageData]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Image(s) uploaded");
  }

  async function handleDeleteImage() {
    if (!deleteTarget || deleteTarget.type !== "image") return;
    setDeleteLoading(true);

    const img = images.find((i) => i.id === deleteTarget.id);
    if (!img) {
      setDeleteLoading(false);
      setDeleteTarget(null);
      return;
    }

    const { error } = await deleteProductImage(img.id, img.storage_path);
    if (error) {
      toast.error(error);
    } else {
      const remaining = images.filter((i) => i.id !== img.id);
      if (img.is_primary && remaining.length > 0 && created) {
        remaining[0].is_primary = true;
        setPrimaryImage(created, remaining[0].id);
      }
      setImages(remaining);
      toast.success("Image deleted");
    }

    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  async function handleSetPrimary(imageId: string) {
    if (!created) return;
    const { error } = await setPrimaryImage(created, imageId);
    if (error) {
      toast.error(error);
      return;
    }
    setImages((prev) =>
      prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
    );
  }

  async function handleAddImageUrl() {
    if (!created || !imageUrl.trim()) {
      toast.error("Enter an image URL");
      return;
    }
    if (!imageUrl.trim().match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i)) {
      toast.error("Enter a valid image URL (jpg, png, webp, gif)");
      return;
    }

    setAddingUrl(true);
    const { data, error } = await addProductImageByUrl(
      created,
      imageUrl.trim(),
      "",
      false
    );

    if (error) {
      toast.error(error);
      setAddingUrl(false);
      return;
    }

    setImages((prev) => [...prev, data]);
    setImageUrl("");
    setAddingUrl(false);
    toast.success("Image added");
  }

  // ============================================================
  // Variant attribute handling
  // ============================================================

  async function handleAddAttribute() {
    if (!created) return;
    if (!newAttrName.trim()) {
      toast.error("Attribute name is required");
      return;
    }

    const displayName = newAttrDisplayName.trim() || newAttrName.trim();
    const { data, error } = await createVariantAttribute(created, newAttrName.trim(), displayName);

    if (error) {
      toast.error(error);
      return;
    }

    setAttributes((prev) => [...prev, { ...data, variant_options: [] }]);
    setNewAttrName("");
    setNewAttrDisplayName("");
    toast.success("Attribute added");
  }

  async function handleDeleteAttribute(attrId: string) {
    const { error } = await deleteVariantAttribute(attrId);
    if (error) {
      toast.error(error);
    } else {
      setAttributes((prev) => prev.filter((a) => a.id !== attrId));
      toast.success("Attribute deleted");
    }
    setDeleteTarget(null);
  }

  // ============================================================
  // Variant option handling
  // ============================================================

  async function handleAddOption(attributeId: string) {
    const value = newOptionValues[attributeId]?.trim();
    if (!value) {
      toast.error("Option value is required");
      return;
    }

    const { data, error } = await createVariantOption(attributeId, value);
    if (error) {
      toast.error(error);
      return;
    }

    setAttributes((prev) =>
      prev.map((a) =>
        a.id === attributeId
          ? { ...a, variant_options: [...a.variant_options, data] }
          : a
      )
    );

    setNewOptionValues((prev) => ({ ...prev, [attributeId]: "" }));
    toast.success("Option added");
  }

  async function handleDeleteOption(optionId: string) {
    const { error } = await deleteVariantOption(optionId);
    if (error) {
      toast.error(error);
    } else {
      setAttributes((prev) =>
        prev.map((a) => ({
          ...a,
          variant_options: a.variant_options.filter((o) => o.id !== optionId),
        }))
      );
      toast.success("Option deleted");
    }
    setDeleteTarget(null);
  }

  // ============================================================
  // Variant SKU handling
  // ============================================================

  async function handleCreateVariant() {
    if (!created) return;
    if (!skuForm.sku.trim()) {
      toast.error("SKU is required");
      return;
    }
    if (!skuForm.price || Number(skuForm.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (!skuForm.stock_quantity) {
      toast.error("Stock quantity is required");
      return;
    }

    const optionIds = Object.values(skuForm.option_selections).filter(Boolean);
    if (attributes.length > 0 && optionIds.length !== attributes.length) {
      toast.error("Select one option for each attribute");
      return;
    }

    const { data, error } = await createProductVariant({
      product_id: created,
      sku: skuForm.sku.trim(),
      price: Number(skuForm.price),
      compare_at_price: skuForm.compare_at_price
        ? Number(skuForm.compare_at_price)
        : undefined,
      stock_quantity: Number(skuForm.stock_quantity),
      weight_grams: skuForm.weight_grams ? Number(skuForm.weight_grams) : undefined,
      barcode: skuForm.barcode.trim() || undefined,
      option_ids: optionIds,
    });

    if (error) {
      toast.error(error);
      return;
    }

    const { data: fullVariant } = await getProductVariantById(data.id);
    setVariants((prev) => [...prev, fullVariant]);

    setSkuForm({
      sku: "",
      price: "",
      compare_at_price: "",
      stock_quantity: "",
      weight_grams: "",
      barcode: "",
      option_selections: {},
    });
    setShowSkuForm(false);
    toast.success("Variant created");
  }

  async function handleDeleteVariant() {
    if (!deleteTarget || deleteTarget.type !== "variant") return;
    setDeleteLoading(true);

    const { error } = await deleteProductVariant(deleteTarget.id);
    if (error) {
      toast.error(error);
    } else {
      setVariants((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      toast.success("Variant deleted");
    }

    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  // ============================================================
  // Render: Step 1 - Create Product (matching edit page layout)
  // ============================================================

  if (!created) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Products
          </Link>
          <Button
            onClick={handleCreateProduct}
            disabled={loading}
            className="bg-primary text-primary-foreground"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
        </div>

        <h1 className="font-heading text-2xl font-light">New Product</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2">
            <div className="border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-medium">Basic Info</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Product name"
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
                <label className="text-sm font-medium">Short Description</label>
                <Input
                  placeholder="Brief product summary"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Full product description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  placeholder="comma separated tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-medium">Pricing</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price (NGN) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  min="0"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-medium">Settings</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-gold"
                />
                <span className="text-sm font-medium">Featured product</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Step 2 - Images & Variants (matching edit page layout)
  // ============================================================

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href={`/products/${created}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to product
        </Link>
        <Button
          onClick={() => router.push(`/products/${created}`)}
          className="bg-primary text-primary-foreground"
        >
          Done
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-light">Add Images & Variants</h1>
        <p className="text-sm text-muted-foreground mt-1">{name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                Images ({images.length})
              </h2>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-border"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Add Images
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Or paste image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                className="h-8 text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddImageUrl}
                disabled={addingUrl}
                className="h-8 border-border text-xs shrink-0"
              >
                {addingUrl ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Add URL"
                )}
              </Button>
            </div>

            {images.length === 0 ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No images yet. Click to upload.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((img) => (
                    <div
                      key={img.id}
                      className={`relative group border bg-muted overflow-hidden ${
                        img.is_primary ? "border-gold ring-1 ring-gold" : "border-border"
                      }`}
                    >
                      <div className="aspect-square">
                        <img
                          src={img.optimized_url || img.original_url}
                          alt={img.alt_text || name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {(img.processing_status === "pending" ||
                        img.processing_status === "processing") && (
                        <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[9px] px-1.5 py-0.5 font-medium">
                          Processing
                        </div>
                      )}
                      {img.is_primary && (
                        <div className="absolute top-1.5 right-1.5 bg-gold text-white text-[9px] px-1.5 py-0.5 font-medium">
                          Primary
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!img.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(img.id)}
                            className="p-1.5 bg-white text-black hover:bg-gold hover:text-white transition-colors"
                            title="Set as primary"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteTarget({ type: "image", id: img.id, label: "image" })
                          }
                          className="p-1.5 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              Variants
            </h2>

            {/* Variant Attributes */}
            {attributes.length > 0 && (
              <div className="space-y-3">
                {attributes.map((attr) => (
                  <div key={attr.id} className="border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const next = new Set(expandedAttrs);
                          if (next.has(attr.id)) next.delete(attr.id);
                          else next.add(attr.id);
                          setExpandedAttrs(next);
                        }}
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        {expandedAttrs.has(attr.id) ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        {attr.display_name}
                        <span className="text-xs text-muted-foreground">
                          ({attr.variant_options.length} options)
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ type: "attribute", id: attr.id, label: attr.display_name })
                        }
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {expandedAttrs.has(attr.id) && (
                      <div className="ml-6 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {attr.variant_options
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((opt) => (
                              <span
                                key={opt.id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted border border-border"
                              >
                                {opt.display_value || opt.value}
                                <button
                                  onClick={() =>
                                    setDeleteTarget({ type: "option", id: opt.id, label: opt.value, extra: attr.id })
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add option value"
                            value={newOptionValues[attr.id] || ""}
                            onChange={(e) =>
                              setNewOptionValues((prev) => ({ ...prev, [attr.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOption(attr.id);
                              }
                            }}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(attr.id)}
                            className="h-8 border-border text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add new attribute */}
            <div className="border border-dashed border-border p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Add attribute</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Name (e.g., color)"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Input
                  placeholder="Display (e.g., Color)"
                  value={newAttrDisplayName}
                  onChange={(e) => setNewAttrDisplayName(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                  className="h-8 border-border text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* SKU list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground">
                  SKUs ({variants.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkuForm(!showSkuForm)}
                  className="h-8 border-border text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add SKU
                </Button>
              </div>

              {showSkuForm && (
                <div className="border border-border p-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="SKU *"
                      value={skuForm.sku}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, sku: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Price (NGN) *"
                      value={skuForm.price}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Compare at price"
                      value={skuForm.compare_at_price}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, compare_at_price: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Stock *"
                      value={skuForm.stock_quantity}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Weight (g)"
                      value={skuForm.weight_grams}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, weight_grams: e.target.value }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Barcode"
                      value={skuForm.barcode}
                      onChange={(e) => setSkuForm((prev) => ({ ...prev, barcode: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>

                  {attributes.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {attributes.map((attr) => (
                        <select
                          key={attr.id}
                          value={skuForm.option_selections[attr.id] || ""}
                          onChange={(e) =>
                            setSkuForm((prev) => ({
                              ...prev,
                              option_selections: { ...prev.option_selections, [attr.id]: e.target.value },
                            }))
                          }
                          className="h-8 text-xs rounded-lg border border-input bg-transparent px-2 outline-none"
                        >
                          <option value="">Select {attr.display_name}</option>
                          {attr.variant_options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.display_value || opt.value}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateVariant}
                      className="h-8 bg-primary text-primary-foreground text-xs"
                    >
                      Create SKU
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSkuForm(false)}
                      className="h-8 border-border text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-medium">{variant.sku}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 font-medium ${
                              variant.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {variant.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {variant.product_variant_selections.map((sel) => (
                            <span key={sel.id}>
                              {sel.variant_options.variant_attributes.display_name}:{" "}
                              {sel.variant_options.display_value || sel.variant_options.value}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium tabular-nums">{formatNaira(variant.price)}</span>
                          {variant.compare_at_price && (
                            <span className="text-muted-foreground line-through tabular-nums">
                              {formatNaira(variant.compare_at_price)}
                            </span>
                          )}
                          <span className="text-muted-foreground">Stock: {variant.stock_quantity}</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setDeleteTarget({ type: "variant", id: variant.id, label: variant.sku })
                        }
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Pricing</h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Base Price (NGN)</label>
              <p className="text-sm tabular-nums">{formatNaira(Number(basePrice) || 0)}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <p className="text-sm">{categories.find((c) => c.id === categoryId)?.name || "—"}</p>
            </div>
          </div>

          <div className="border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-medium">Settings</h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium ${
                  status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Featured</label>
              <p className="text-sm">{isFeatured ? "Yes" : "No"}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Images</label>
              <p className="text-sm tabular-nums">{images.length}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Variants</label>
              <p className="text-sm tabular-nums">{variants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.type === "variant"
              ? `Delete SKU "${deleteTarget.label}"? This will also remove all its selections.`
              : deleteTarget?.type === "attribute"
              ? `Delete attribute "${deleteTarget.label}"? This will also remove all its options and related variants.`
              : `Delete this ${deleteTarget?.type}? This action cannot be undone.`}
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 h-9 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "image") handleDeleteImage();
                else if (deleteTarget.type === "attribute") handleDeleteAttribute(deleteTarget.id);
                else if (deleteTarget.type === "option") handleDeleteOption(deleteTarget.id);
                else if (deleteTarget.type === "variant") handleDeleteVariant();
              }}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
