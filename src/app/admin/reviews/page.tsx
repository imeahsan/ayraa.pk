"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/storefront/Button/Button";
import { submitManualAdminReview, deleteReview } from "@/app/actions/reviews";
import styles from "../admin.module.css";

interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string | null;
  images: string[];
  is_verified_buyer: boolean;
  is_approved: boolean;
  created_at: string;
  product?: {
    name: string;
    slug: string;
  };
}

interface ProductInfo {
  id: string;
  name: string;
}

export default function AdminReviewsPage() {
  const supabase = createClient();
  const toast = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [search, setSearch] = useState("");

  // Manual Review Form State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manual Review images upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
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

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("product_reviews")
        .select("*, product:products(name, slug)")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews((reviewsData as any) || []);

      // Fetch active products list for manual review form
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (err) {
      console.error("Failed to load reviews data:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setDeletingId(reviewId);
    const result = await deleteReview(reviewId);
    setDeletingId(null);

    if (result.success) {
      toast.success("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } else {
      toast.error(result.error || "Failed to delete review.");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !reviewerName.trim() || !reviewText.trim()) {
      toast.warning("Please fill all required fields.");
      return;
    }

    setSubmittingManual(true);
    setIsUploading(true);
    let uploadedUrls: string[] = [];

    try {
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
      console.error("Error uploading manual review images:", uploadErr);
      toast.error("Failed to upload images. Please try again.");
      setSubmittingManual(false);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    const result = await submitManualAdminReview(
      selectedProductId,
      reviewerName.trim(),
      rating,
      reviewText.trim(),
      isVerified,
      uploadedUrls
    );
    setSubmittingManual(false);

    if (result.success) {
      toast.success("Manual review posted successfully!");
      // Reset form
      setSelectedProductId("");
      setReviewerName("");
      setRating(5);
      setReviewText("");
      setIsVerified(true);
      setSelectedFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      // Reload reviews and switch back to list
      fetchData();
      setActiveTab("list");
    } else {
      toast.error(result.error || "Failed to submit manual review.");
    }
  };

  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const term = search.toLowerCase();
    return reviews.filter((r) => {
      const prodName = r.product?.name?.toLowerCase() || "";
      const revName = r.reviewer_name.toLowerCase();
      const text = r.review_text?.toLowerCase() || "";
      return prodName.includes(term) || revName.includes(term) || text.includes(term);
    });
  }, [reviews, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.pageLayout}>
      {/* Tabs bar */}
      <div className={styles.filterContainer} style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setActiveTab("list")}
            className={styles.topbarButton}
            style={{
              backgroundColor: activeTab === "list" ? "var(--color-gold-muted)" : "transparent",
              color: activeTab === "list" ? "var(--color-gold)" : "var(--admin-text-sub)",
              borderColor: activeTab === "list" ? "var(--color-gold)" : "var(--admin-border)",
            }}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={styles.topbarButton}
            style={{
              backgroundColor: activeTab === "add" ? "var(--color-gold-muted)" : "transparent",
              color: activeTab === "add" ? "var(--color-gold)" : "var(--admin-text-sub)",
              borderColor: activeTab === "add" ? "var(--color-gold)" : "var(--admin-border)",
            }}
          >
            ➕ Write Manual Review
          </button>
        </div>

        {activeTab === "list" && (
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search reviews by product or reviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}
      </div>

      {loading ? (
        <p className="font-body text-sm text-admin-text-sub text-center py-12">Loading reviews...</p>
      ) : activeTab === "list" ? (
        /* Reviews List View */
        filteredReviews.length === 0 ? (
          <div className={styles.tableCard} style={{ padding: "48px", textAlign: "center" }}>
            No reviews found matching your search.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredReviews.map((r) => (
              <div key={r.id} className={styles.formCard} style={{ gap: "16px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--admin-border)", paddingBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gold)", fontWeight: "bold" }}>
                      Product Review
                    </span>
                    <h4 style={{ margin: "4px 0 0 0", fontFamily: "var(--font-headline)", fontSize: "16px" }}>
                      {r.product ? (
                        <Link href={`/product/${r.product.slug}`} target="_blank" style={{ color: "inherit", textDecoration: "none" }} className={styles.tableLink}>
                          {r.product.name}
                        </Link>
                      ) : (
                        "Unknown Product"
                      )}
                    </h4>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--admin-text-sub)" }}>
                    Submitted {formatDate(r.created_at)}
                  </span>
                </div>

                {/* Rating & Reviewer info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Stars */}
                    <div style={{ display: "flex", gap: "2px" }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} style={{ color: idx < r.rating ? "var(--color-gold)" : "rgba(255,255,255,0.15)", fontSize: "16px" }}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{r.reviewer_name}</span>
                    {r.is_verified_buyer && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-gold)",
                          backgroundColor: "var(--color-gold-muted)",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Verified Buyer
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    style={{ borderColor: "#dc2626", color: "#dc2626", padding: "4px 12px", fontSize: "12px" }}
                  >
                    Delete Review
                  </Button>
                </div>

                {/* Content */}
                <p style={{ margin: 0, fontSize: "14px", color: "var(--admin-text-sub)", lineHeight: "1.6" }}>
                  {r.review_text}
                </p>

                {/* Images Gallery */}
                {r.images && r.images.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                    {r.images.map((imgUrl: string, idx: number) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          borderRadius: "4px",
                          overflow: "hidden",
                          width: "60px",
                          height: "60px",
                          border: "1px solid var(--admin-border)",
                          transition: "opacity 0.2s",
                          display: "inline-block"
                        }}
                        className="hover:opacity-80"
                      >
                        <img
                          src={imgUrl}
                          alt="Review attachment"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Manual Review Form */
        <div className={styles.formCard} style={{ maxWidth: "600px", marginInline: "auto" }}>
          <h3 style={{ fontFamily: "var(--font-headline)", fontSize: "20px", marginBottom: "20px" }}>
            Add Manual Store Review
          </h3>

          <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Product selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className={styles.formInput}
                style={{ backgroundColor: "rgba(255,255,255,0.02)", color: "var(--admin-text)" }}
              >
                <option value="" style={{ background: "#111" }}>-- Select a Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "#111" }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reviewer Name */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reviewer Name *</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Sarah M."
                required
                className={styles.formInput}
              />
            </div>

            {/* Star rating */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rating (1-5 Stars) *</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                required
                className={styles.formInput}
                style={{ backgroundColor: "rgba(255,255,255,0.02)", color: "var(--admin-text)" }}
              >
                <option value={5} style={{ background: "#111" }}>5 Stars (Excellent)</option>
                <option value={4} style={{ background: "#111" }}>4 Stars (Very Good)</option>
                <option value={3} style={{ background: "#111" }}>3 Stars (Average)</option>
                <option value={2} style={{ background: "#111" }}>2 Stars (Poor)</option>
                <option value={1} style={{ background: "#111" }}>1 Star (Very Poor)</option>
              </select>
            </div>

            {/* Review Text */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Review Text *</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Type the review content to be displayed on the product page..."
                rows={5}
                required
                className={styles.formTextarea}
              />
            </div>

            {/* Verified Buyer Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="isVerified"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--color-gold)" }}
              />
              <label htmlFor="isVerified" style={{ fontSize: "14px", cursor: "pointer", userSelect: "none" }}>
                Mark as Verified Buyer
              </label>
            </div>

            {/* Image attachments */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Attach Pictures (Max 5)</label>
              
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "8px" }}>
                {previews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: "80px",
                      height: "80px",
                      position: "relative",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "1px solid var(--admin-border)",
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
                      ✕
                    </button>
                  </div>
                ))}

                {selectedFiles.length < 5 && (
                  <label
                    style={{
                      width: "80px",
                      height: "80px",
                      border: "1px dashed var(--admin-border)",
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
                    <span style={{ fontSize: "20px", color: "var(--admin-text-sub)" }}>+</span>
                    <span style={{ fontSize: "11px", color: "var(--admin-text-sub)" }}>Upload</span>
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("list")}
                disabled={submittingManual || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="luxury"
                isLoading={submittingManual || isUploading}
                disabled={!selectedProductId || !reviewerName.trim() || !reviewText.trim() || isUploading}
              >
                {isUploading ? "Uploading..." : "Create Review"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
