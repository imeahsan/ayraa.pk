"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Checks if the currently logged-in user has purchased a specific product.
 * Returns true if they have a non-cancelled order containing the product, false otherwise.
 */
export async function checkPurchaseStatus(productId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Query order_items to find if any belong to user's non-cancelled orders
    const { data, error } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .neq("orders.status", "cancelled")
      .limit(1);

    if (error) {
      console.error("Error checking purchase status:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error("Failed to check purchase status:", err);
    return false;
  }
}

/**
 * Submits a product review for a logged-in user who has purchased the product.
 */
export async function submitReview(
  productId: string,
  rating: number,
  reviewText: string,
  images: string[] = []
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to write a review." };
    }

    // Verify purchase
    const hasPurchased = await checkPurchaseStatus(productId);
    if (!hasPurchased) {
      return {
        success: false,
        error: "Only verified buyers who purchased this product can leave a review.",
      };
    }

    // Fetch user's profile to get their name
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const reviewerName = profile?.full_name?.trim() || "Verified Buyer";

    // Insert review
    const { error: insertError } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      reviewer_name: reviewerName,
      rating,
      review_text: reviewText.trim(),
      images,
      is_verified_buyer: true,
      is_approved: true,
    });

    if (insertError) throw insertError;

    return { success: true };
  } catch (err: any) {
    console.error("Failed to submit review:", err);
    return { success: false, error: err.message || "Failed to submit review" };
  }
}

/**
 * Allows administrators to manually insert a review on behalf of a user.
 */
export async function submitManualAdminReview(
  productId: string,
  reviewerName: string,
  rating: number,
  reviewText: string,
  isVerified: boolean,
  images: string[] = []
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin role required." };
    }

    // Insert review
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      reviewer_name: reviewerName.trim(),
      rating,
      review_text: reviewText.trim(),
      images,
      is_verified_buyer: isVerified,
      is_approved: true,
      user_id: null, // manual admin review has no customer account link
    });

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Failed to submit manual review:", err);
    return { success: false, error: err.message || "Failed to submit manual review" };
  }
}

/**
 * Allows administrators to delete/moderate a review.
 */
export async function deleteReview(reviewId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin role required." };
    }

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete review:", err);
    return { success: false, error: err.message || "Failed to delete review" };
  }
}
