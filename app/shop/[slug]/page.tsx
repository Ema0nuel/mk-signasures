import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import type { ProductReview } from "@/types/database";
import ProductDetailClient from "./product-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const description =
    product.meta_description ||
    product.short_description ||
    `Shop ${product.name} at MK Signasures.`;

  const imageUrl =
    product.product_images?.[0]?.optimized_url ||
    product.product_images?.[0]?.original_url;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `https://mksgn.shop/shop/${product.slug}`,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://mksgn.shop/shop/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.category_id,
    product.id
  );

  const imageUrl =
    product.product_images?.[0]?.optimized_url ||
    product.product_images?.[0]?.original_url;

  const avgRating =
    product.reviews?.length
      ? product.reviews.reduce((sum: number, r: ProductReview) => sum + r.rating, 0) /
        product.reviews.length
      : null;

  return (
    <div className="min-h-screen">
      {/* Product structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.meta_description || product.short_description || product.description,
            image: imageUrl ? [imageUrl] : [],
            brand: { "@type": "Brand", name: "MK Signasures" },
            url: `https://mksgn.shop/shop/${product.slug}`,
            offers: {
              "@type": "Offer",
              priceCurrency: "NGN",
              price: product.base_price,
              availability: product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `https://mksgn.shop/shop/${product.slug}`,
            },
            ...(avgRating && product.reviews?.length
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: Math.round(avgRating * 10) / 10,
                    reviewCount: product.reviews.length,
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-gold transition-colors duration-150">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-gold transition-colors duration-150">
            Shop
          </Link>
          <span>/</span>
          {product.categories && (
            <>
              <Link
                href={`/shop?category=${product.categories.slug}`}
                className="hover:text-gold transition-colors duration-150"
              >
                {product.categories.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Product detail */}
      <ProductDetailClient product={product} />

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-center text-xs tracking-widest uppercase text-muted-foreground mb-4">
            You May Also Like
          </p>
          <h2 className="text-center font-heading text-3xl sm:text-4xl font-light mb-10 sm:mb-16">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/shop/${rp.slug}`}
                className="group block"
              >
                <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-secondary ring-1 ring-foreground/10">
                  {rp.product_images?.[0] ? (
                    <img
                      src={
                        rp.product_images[0].optimized_url ||
                        rp.product_images[0].original_url
                      }
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="py-3">
                  {rp.categories && (
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {rp.categories.name}
                    </p>
                  )}
                  <h3 className="mt-1 text-sm font-medium group-hover:text-gold transition-colors duration-150 line-clamp-1">
                    {rp.name}
                  </h3>
                  <p className="mt-1 text-sm text-foreground font-medium">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(rp.base_price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
