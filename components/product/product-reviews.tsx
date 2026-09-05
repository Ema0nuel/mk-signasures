"use client";

import { useState, useEffect } from "react";
import { Star, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProductReview } from "@/types/database";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-gold text-gold"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }: { reviews: ProductReview[] }) {
  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: (reviews.filter((r) => r.rating === star).length / reviews.length) * 100,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
      <div className="text-center sm:text-left">
        <p className="text-4xl font-medium">{avg.toFixed(1)}</p>
        <StarRating rating={Math.round(avg)} />
        <p className="mt-1 text-sm text-muted-foreground">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {distribution.map((d) => (
          <div key={d.star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-muted-foreground">{d.star}</span>
            <div className="flex-1 h-2 bg-secondary overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground text-xs">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess: (review: ProductReview) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!body.trim()) {
      setError("Please enter a review");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: user!.id,
        author_name: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Customer",
        rating,
        title: title.trim(),
        body: body.trim(),
        verified: false,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You have already reviewed this product");
      } else {
        setError("Failed to submit review. Please try again.");
      }
      setLoading(false);
      return;
    }

    toast.success("Review submitted");
    setRating(0);
    setTitle("");
    setBody("");
    setLoading(false);
    onSuccess(data as ProductReview);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-gold text-gold"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Review</label>
        <textarea
          placeholder="Tell others about your experience with this product"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="bg-primary text-primary-foreground"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}

export default function ProductReviews({
  reviews: initialReviews,
  productName,
  productId,
}: {
  reviews: ProductReview[];
  productName: string;
  productId: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { open } = useAuthDialog();
  const displayed = showAll ? reviews : reviews.slice(0, 3);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleNewReview(review: ProductReview) {
    setReviews((prev) => [review, ...prev]);
  }

  if (reviews.length === 0 && mounted && !isAuthenticated) {
    return (
      <section className="py-12 sm:py-16">
        <h2 className="font-heading text-2xl font-light mb-6">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">
          No reviews yet. Be the first to review this product.
        </p>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <h2 className="font-heading text-2xl font-light mb-8">
        Customer Reviews
      </h2>

      {reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {/* Review Form - only for logged-in users */}
      {mounted && (
      <div className="mt-8">
        {isAuthenticated ? (
          <div className="border border-border p-5">
            <h3 className="text-sm font-medium mb-4">Write a Review</h3>
            <ReviewForm productId={productId} onSuccess={handleNewReview} />
          </div>
        ) : (
          <button
            onClick={open}
            className="text-sm text-gold hover:underline"
          >
            Sign in to write a review
          </button>
        )}
      </div>
      )}

      {/* Reviews List */}
      <div className="mt-8 space-y-6 divide-y divide-border">
        {displayed.map((review) => (
          <div key={review.id} className="pt-6 first:pt-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                  {review.author_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{review.author_name}</p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.verified && (
                      <span className="text-[10px] text-green-600 font-medium uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <time className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <h3 className="text-sm font-medium mt-3">{review.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {review.body}
            </p>
          </div>
        ))}
      </div>

      {reviews.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 flex items-center gap-1 text-sm font-medium text-foreground hover:text-gold transition-colors duration-150 mx-auto"
        >
          Show all {reviews.length} reviews
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}
