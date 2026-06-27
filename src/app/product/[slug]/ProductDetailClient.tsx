"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { SizeSelector } from "@/components/storefront/SizeSelector/SizeSelector";
import { ImageGallery } from "@/components/storefront/ImageGallery/ImageGallery";
import { Breadcrumb } from "@/components/storefront/Breadcrumb/Breadcrumb";
import { ProductCard } from "@/components/storefront/ProductCard/ProductCard";
import { submitQuestion } from "@/app/actions/qa";
import { createClient } from "@/lib/supabase/client";
import { checkPurchaseStatus, submitReview } from "@/app/actions/reviews";
import { useWishlist } from "@/context/WishlistContext";
import styles from "./ProductDetailClient.module.css";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  initialQuestions?: any[];
  initialReviews?: any[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product: initialProduct,
  relatedProducts,
  initialQuestions = [],
  initialReviews = [],
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const { addItem } = useCart();
  const toast = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlistUpdating, setIsWishlistUpdating] = useState(false);

  // QA state & handler
  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questions, setQuestions] = useState<any[]>(initialQuestions);

  // Reviews state & validation
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Review form inputs
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTextInput, setReviewTextInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review image uploads state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox modal state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevLightboxImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const isPreviewMode = searchParams.get("preview") === "true";
      if (isPreviewMode) {
        try {
          const saved = localStorage.getItem("ayra-preview-product");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.slug === initialProduct.slug) {
              setProduct(parsed as Product);
            }
          }
        } catch (e) {
          console.error("Failed to load preview product from local storage:", e);
        }
      }
    }
  }, [initialProduct.slug]);

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      if (selectedFiles.length + filesArray.length > 5) {
        toast.warning("You can upload a maximum of 5 images.");
        return;
      }

      const validFiles = filesArray.filter(file => file.type.startsWith("image/"));
      if (validFiles.length !== filesArray.length) {
        toast.warning("Only image files are allowed.");
      }

      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);

      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          const eligible = await checkPurchaseStatus(product.id);
          setHasPurchased(eligible);
        } else {
          setIsLoggedIn(false);
          setHasPurchased(false);
        }
      } catch (err) {
        console.error("Error verifying eligibility:", err);
      } finally {
        setCheckingEligibility(false);
      }
    };
    checkEligibility();
  }, [product.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTextInput.trim()) return;

    setIsSubmittingReview(true);
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const supabase = createClient();
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { data, error } = await supabase.storage
          .from("review-images")
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("review-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    } catch (uploadErr: any) {
      console.error("Error uploading review images:", uploadErr);
      toast.error("Failed to upload images. Please try again.");
      setIsSubmittingReview(false);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    const result = await submitReview(product.id, ratingInput, reviewTextInput.trim(), uploadedUrls);
    setIsSubmittingReview(false);

    if (result.success) {
      toast.success("Thank you! Your review has been posted successfully.");
      setReviewTextInput("");
      setRatingInput(5);
      setSelectedFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      
      // Reload reviews
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("product_reviews")
          .select("*")
          .eq("product_id", product.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });
        if (data) {
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to reload reviews:", err);
      }
    } else {
      toast.error(result.error || "Failed to submit review.");
    }
  };

  const totalReviews = reviews.length;

  const averageRating = React.useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [reviews, totalReviews]);

  const starCounts = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    return counts.reverse(); // Now Index 0 = 5 stars, Index 4 = 1 star
  }, [reviews]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmittingQuestion(true);
    const result = await submitQuestion(product.id, questionText.trim());
    setIsSubmittingQuestion(false);

    if (result.success) {
      toast.success("Your question has been submitted, you will be answered shortly.");
      setQuestionText("");
    } else {
      toast.error(result.error || "Failed to submit question. Please try again.");
    }
  };
  
  // Accordion state
  const [activeTab, setActiveTab] = useState<string | null>("fabric");

  const variants = product.variants || [];

  // A product has custom sizes if any variant has a size that is NOT "Standard"
  const hasSizes = React.useMemo(() => {
    return variants.some((v) => !["Standard", "One Size", "OS"].includes(v.size));
  }, [variants]);

  // A product has custom colors if any variant has a color that is NOT "Standard"
  const hasColors = React.useMemo(() => {
    return variants.some((v) => v.color && v.color !== "Standard");
  }, [variants]);

  // List of unique colors available
  const availableColors = React.useMemo(() => {
    if (!hasColors) return [];
    const list = new Set<string>();
    variants.forEach((v) => {
      if (v.color) list.add(v.color);
    });
    return Array.from(list);
  }, [variants, hasColors]);

  // Filtered variants for size selection (based on selected color if applicable)
  const filteredVariantsForSize = React.useMemo(() => {
    if (!hasColors) return variants;
    if (!selectedColor) return [];
    return variants.filter((v) => v.color === selectedColor);
  }, [variants, hasColors, selectedColor]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null); // Reset size on color change
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  const isOutOfStock = React.useMemo(() => {
    if (hasColors && hasSizes) {
      if (!selectedColor || !selectedSize) return false;
      const v = variants.find((v) => v.color === selectedColor && v.size === selectedSize);
      return v ? v.stock_quantity <= 0 : true;
    } else if (hasColors) {
      if (!selectedColor) return false;
      const v = variants.find((v) => v.color === selectedColor);
      return v ? v.stock_quantity <= 0 : true;
    } else if (hasSizes) {
      if (!selectedSize) return false;
      const v = variants.find((v) => v.size === selectedSize);
      return v ? v.stock_quantity <= 0 : true;
    } else {
      return variants[0] ? variants[0].stock_quantity <= 0 : true;
    }
  }, [hasColors, hasSizes, selectedColor, selectedSize, variants]);

  const handleAddToCart = () => {
    if (hasColors && !selectedColor) {
      toast.warning("Please select a color first.");
      return;
    }
    if (hasSizes && !selectedSize) {
      toast.warning("Please select a size first.");
      return;
    }

    setIsAdding(true);
    
    // Find selected variant
    let selectedVariant = null;
    if (hasColors && hasSizes) {
      selectedVariant = variants.find((v) => v.color === selectedColor && v.size === selectedSize) || null;
    } else if (hasColors) {
      selectedVariant = variants.find((v) => v.color === selectedColor && v.size === "Standard") || null;
    } else if (hasSizes) {
      selectedVariant = variants.find((v) => v.size === selectedSize && v.color === "Standard") || null;
    } else {
      selectedVariant = variants[0] || null;
    }
    
    // Add to cart with delay to show premium feel loading state
    setTimeout(() => {
      addItem(product, selectedVariant, 1);
      setIsAdding(false);
    }, 600);
  };

  const handleWishlistToggle = async () => {
    setIsWishlistUpdating(true);
    try {
      await toggleWishlist(product);
    } finally {
      setIsWishlistUpdating(false);
    }
  };

  const formattedPrice = Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedComparePrice = product.compare_at_price
    ? Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(product.compare_at_price)
    : null;
  const wishlisted = isWishlisted(product.id);

  return (
    <div className={styles.container}>
      <Breadcrumb
        items={[
          { label: "Wardrobe", url: "/collections" },
          { label: product.name, url: `/product/${product.slug}` },
        ]}
      />

      <div className={styles.layout}>
        {/* Left Side: Images */}
        <div className={styles.leftSide}>
          {product.images && <ImageGallery images={product.images} />}
        </div>

        {/* Right Side: Details */}
        <div className={styles.rightSide}>
          <div className={styles.header}>
            <h1 className={styles.title}>{product.name}</h1>
            <div className={styles.priceRow}>
              <span className={styles.price}>{formattedPrice}</span>
              {formattedComparePrice && (
                <span className={styles.comparePrice}>{formattedComparePrice}</span>
              )}
            </div>
          </div>

          <p className={styles.description}>{product.description}</p>

          <div className={styles.trustStrip}>
            <span>Cash on Delivery</span>
            <span>3 to 5 day delivery</span>
            <span>Easy returns</span>
          </div>

          {/* Product attributes */}
          <div className={styles.attributes}>
            {product.fabric && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Fabric:</span>
                <span className={styles.attrVal}>{product.fabric}</span>
              </div>
            )}
            {product.color && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Color:</span>
                <span className={styles.attrVal}>{product.color}</span>
              </div>
            )}
            {product.includes && (
              <div className={styles.attrRow}>
                <span className={styles.attrLabel}>Includes:</span>
                <span className={styles.attrVal}>{product.includes}</span>
              </div>
            )}
          </div>

          {/* Color selection */}
          {hasColors && (
            <div className="mt-2 flex flex-col gap-2">
              <span className={styles.attrLabel} style={{ fontWeight: "600", fontSize: "14px" }}>Select Color:</span>
              <div className="flex gap-3 flex-wrap">
                {availableColors.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      style={{
                        padding: "8px 16px",
                        border: isSelected ? "2px solid var(--color-gold)" : "1px solid var(--color-border)",
                        backgroundColor: isSelected ? "var(--color-gold-muted)" : "transparent",
                        color: isSelected ? "var(--color-gold)" : "var(--color-on-surface)",
                        fontSize: "14px",
                        fontFamily: "var(--font-body)",
                        fontWeight: isSelected ? "600" : "400",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selection */}
          {hasSizes && (
            <div className="mt-2">
              {hasColors && !selectedColor ? (
                <p style={{ fontSize: "12px", fontStyle: "italic", color: "var(--color-on-surface-sub)" }}>Please select a color to see available sizes.</p>
              ) : (
                <SizeSelector
                  variants={filteredVariantsForSize}
                  selectedSize={selectedSize}
                  onChange={handleSizeChange}
                />
              )}
            </div>
          )}

          {/* Purchase Actions */}
          <div className="mt-4 flex flex-col gap-3">
            <Button
              variant="luxury"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              isLoading={isAdding}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleWishlistToggle}
              isLoading={isWishlistUpdating}
              style={{
                borderColor: wishlisted ? "var(--color-gold)" : "var(--color-border)",
                color: wishlisted ? "var(--color-gold)" : "var(--color-on-surface)",
                backgroundColor: wishlisted ? "var(--color-gold-muted)" : "transparent",
              }}
            >
              {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>

            {product.bedsheet_ar_status === "ready" && (
              <Link href={`/product/${product.slug}/bedsheet-ar`} style={{ width: "100%" }}>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  style={{
                    borderColor: "var(--color-gold)",
                    color: "var(--color-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Preview on My Bed
                </Button>
              </Link>
            )}
          </div>

          {/* Accordion Tabs */}
          <div className={styles.accordion}>
            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "fabric" ? null : "fabric")}
              >
                <span>Fabric &amp; Craftsmanship</span>
                <span>{activeTab === "fabric" ? "-" : "+"}</span>
              </button>
              {activeTab === "fabric" && (
                <div className={styles.accordionContent}>
                  <p>
                    Crafted from {product.fabric || "premium fabric"} showcasing exquisite
                    hand-embellished beadwork, precise alignments, and luxury linings tailored
                    specifically for the modern muse.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "care" ? null : "care")}
              >
                <span>Care Instructions</span>
                <span>{activeTab === "care" ? "-" : "+"}</span>
              </button>
              {activeTab === "care" && (
                <div className={styles.accordionContent}>
                  <p>
                    {product.care_instructions ||
                      "Dry clean only. Do not iron directly on embellishments. Store in a garment cover bag to prevent metallic tarnishing."}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() => setActiveTab(activeTab === "delivery" ? null : "delivery")}
              >
                <span>Delivery &amp; Returns</span>
                <span>{activeTab === "delivery" ? "-" : "+"}</span>
              </button>
              {activeTab === "delivery" && (
                <div className={styles.accordionContent}>
                  <p>
                    Cash on Delivery (COD) only. Flat shipping rate of PKR 250 (Free shipping on orders above PKR 5,000). Delivered within 3-5 working days. Returns accepted within 7 days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {relatedProducts.length > 0 && (
        <section className={styles.recommendations}>
          <h2 className={styles.recommendationsHeading}>Complete the Look</h2>
          <div className={styles.recommendationsGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Ratings & Reviews Section */}
      <section style={{ marginTop: "64px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "48px" }}>
        <div style={{ maxWidth: "1000px", marginInline: "auto" }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "28px", color: "var(--color-on-surface)", marginBottom: "40px", textAlign: "center" }}>
            Ratings &amp; Reviews
          </h2>

          <div className={styles.reviewsGridContainer}>
            {/* Left Column: Summary */}
            <div className={styles.reviewsSummaryColumn}>
              <div style={{ textAlign: "center", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "20px" }}>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "var(--color-gold)", fontFamily: "var(--font-headline)" }}>
                  {averageRating > 0 ? averageRating : "0.0"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBlock: "8px" }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      style={{
                        color: idx < Math.round(averageRating) ? "var(--color-gold)" : "var(--color-on-surface-muted)",
                        fontSize: "24px",
                      }}
                    >
                      *
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-on-surface-sub)" }}>
                  Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = starCounts[5 - stars] || 0;
                  const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={stars} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                      <span style={{ minWidth: "45px", color: "var(--color-on-surface-sub)", fontWeight: "500" }}>{stars} Star</span>
                      <div style={{ flexGrow: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${percent}%`,
                            backgroundColor: "var(--color-gold)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                      <span style={{ minWidth: "25px", textAlign: "right", color: "var(--color-on-surface-muted)" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Reviews Content & Form */}
            <div className={styles.reviewsContentColumn}>
              {/* Form Section */}
              <div style={{ backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--color-border-subtle)", padding: "28px", borderRadius: "var(--radius-md)" }}>
                <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "18px", color: "var(--color-on-surface)", marginBottom: "6px" }}>
                  Write a Review
                </h3>

                {checkingEligibility ? (
                  <p style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", fontStyle: "italic" }}>Verifying review eligibility...</p>
                ) : !isLoggedIn ? (
                  <div style={{ paddingBlock: "12px" }}>
                    <p style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", marginBottom: "12px" }}>
                      You must be signed in to submit a review for this product.
                    </p>
                    <Link href={`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`}>
                      <Button variant="outline" size="sm">Sign In to Review</Button>
                    </Link>
                  </div>
                ) : !hasPurchased ? (
                  <p style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", fontStyle: "italic", paddingBlock: "8px" }}>
                    Only verified customers who have purchased this product can leave a review.
                  </p>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
                    {/* Star Rating Select */}
                    <div>
                      <span style={{ display: "block", fontSize: "13px", color: "var(--color-on-surface-sub)", marginBottom: "6px", fontWeight: "600" }}>Your Rating:</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className={styles.starButton}
                            style={{
                              color: star <= ratingInput ? "var(--color-gold)" : "rgba(255,255,255,0.15)",
                            }}
                          >
                            *
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", fontWeight: "600" }}>Review Details:</label>
                      <textarea
                        value={reviewTextInput}
                        onChange={(e) => setReviewTextInput(e.target.value)}
                        placeholder="Share your experience with this product (fabric quality, size fitting, color depth)..."
                        rows={4}
                        required
                        style={{
                          width: "100%",
                          padding: "12px",
                          backgroundColor: "transparent",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-on-surface)",
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          outline: "none",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    {/* Image Attachments */}
                    <div>
                      <span style={{ display: "block", fontSize: "13px", color: "var(--color-on-surface-sub)", marginBottom: "8px", fontWeight: "600" }}>
                        Attach Pictures (Max 5):
                      </span>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        {/* Previews */}
                        {previews.map((previewUrl, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: "80px",
                              height: "80px",
                              position: "relative",
                              borderRadius: "4px",
                              overflow: "hidden",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <img
                              src={previewUrl}
                              alt={`Selected preview ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                backgroundColor: "rgba(0, 0, 0, 0.6)",
                                border: "none",
                                color: "white",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                fontSize: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              x
                            </button>
                          </div>
                        ))}

                        {/* File selector trigger */}
                        {selectedFiles.length < 5 && (
                          <label
                            style={{
                              width: "80px",
                              height: "80px",
                              border: "1px dashed var(--color-border)",
                              borderRadius: "4px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              backgroundColor: "rgba(255, 255, 255, 0.01)",
                              transition: "background-color 0.2s",
                            }}
                            className="hover:bg-white/[0.03]"
                          >
                            <span style={{ fontSize: "20px", color: "var(--color-on-surface-sub)" }}>+</span>
                            <span style={{ fontSize: "11px", color: "var(--color-on-surface-sub)" }}>Upload</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileChange}
                              style={{ display: "none" }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        type="submit"
                        variant="luxury"
                        isLoading={isSubmittingReview || isUploading}
                        disabled={!reviewTextInput.trim() || isUploading}
                        style={{ minWidth: "150px" }}
                      >
                        {isUploading ? "Uploading..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Reviews List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "20px", color: "var(--color-on-surface)", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "12px" }}>
                  Product Reviews ({totalReviews})
                </h3>

                {reviews.length === 0 ? (
                  <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--color-on-surface-sub)", paddingBlock: "16px" }}>
                    No reviews yet. Be the first to share your thoughts on this product!
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span
                                key={idx}
                                style={{
                                  color: idx < r.rating ? "var(--color-gold)" : "var(--color-on-surface-muted)",
                                  fontSize: "14px",
                                }}
                              >
                                *
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--color-on-surface)" }}>
                              {r.reviewer_name}
                            </span>
                            {r.is_verified_buyer && (
                              <span className={styles.verifiedBadge}>
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-on-surface-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface-sub)", lineHeight: "1.6" }}>
                        {r.review_text}
                      </p>

                      {/* Review Images Gallery */}
                      {r.images && r.images.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                          {r.images.map((imgUrl: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openLightbox(r.images, idx)}
                              style={{
                                background: "none",
                                padding: 0,
                                cursor: "pointer",
                                borderRadius: "4px",
                                overflow: "hidden",
                                width: "80px",
                                height: "80px",
                                border: "1px solid var(--color-border-subtle)",
                                transition: "opacity 0.2s",
                              }}
                              className="hover:opacity-80"
                            >
                              <img
                                src={imgUrl}
                                alt={`Review image ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section style={{ marginTop: "64px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "48px" }}>
        <div style={{ maxWidth: "800px", marginInline: "auto" }}>
          <h2 style={{ fontFamily: "var(--font-headline)", fontSize: "28px", color: "var(--color-on-surface)", marginBottom: "32px", textAlign: "center" }}>
            Questions &amp; Answers
          </h2>

          {/* List of Q&As */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "48px" }}>
            {questions.length === 0 ? (
              <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--color-on-surface-sub)", textAlign: "center", marginBlock: "24px" }}>
                No questions asked yet. Be the first to ask!
              </p>
            ) : (
              questions.map((q) => (
                <div 
                  key={q.id} 
                  style={{ 
                    borderBottom: "1px solid var(--color-border-subtle)", 
                    paddingBottom: "20px" 
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--color-gold)", textTransform: "uppercase" }}>Q:</span>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--color-on-surface)" }}>
                      {q.question_text}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", paddingLeft: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--color-on-surface-sub)", textTransform: "uppercase" }}>A:</span>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--color-on-surface-sub)", lineHeight: "1.6" }}>
                      {q.answer_text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ask Question Form */}
          <form 
            onSubmit={handleQuestionSubmit} 
            style={{ 
              backgroundColor: "rgba(255,255,255,0.02)", 
              border: "1px solid var(--color-border-subtle)", 
              padding: "32px", 
              borderRadius: "var(--radius-md)" 
            }}
          >
            <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "20px", color: "var(--color-on-surface)", marginBottom: "8px" }}>
              Ask a Question
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-on-surface-sub)", marginBottom: "20px" }}>
              Have a question about fabric, fit, styling, or delivery? Submit it below and we will get back to you shortly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type your question here..."
                rows={4}
                required
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-on-surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical"
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button 
                  type="submit" 
                  variant="luxury" 
                  isLoading={isSubmittingQuestion}
                  disabled={!questionText.trim()}
                  style={{ minWidth: "160px" }}
                >
                  Submit Question
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          >
          {/* Close Button */}
          <button
            type="button"
            onClick={closeLightbox}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              transition: "background 0.2s",
            }}
          >
            x
          </button>

          {/* Prev Button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={prevLightboxImage}
              style={{
                position: "absolute",
                left: "24px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                transition: "background 0.2s",
              }}
            >
              {"<"}
            </button>
          )}

          {/* Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90%",
              maxHeight: "90%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Enlarged review detail"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                borderRadius: "4px",
              }}
            />
            
            {/* Photo counter */}
            <div style={{ color: "rgba(255, 255, 255, 0.7)", marginTop: "16px", fontSize: "14px", letterSpacing: "1px" }}>
              {lightboxIndex + 1} of {lightboxImages.length}
            </div>
          </div>

          {/* Next Button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={nextLightboxImage}
              style={{
                position: "absolute",
                right: "24px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                transition: "background 0.2s",
              }}
            >
              {">"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
