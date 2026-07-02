"use server";

import { createClient } from "@/lib/supabase/server";
import {
  EmailAttemptLog,
  EmailRuntimeDiagnostics,
  MarketingEmailPayload,
  getEmailDeliveryDiagnostics,
  sendMarketingEmail,
  sendOrderEmail,
} from "@/lib/email";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  logs?: EmailAttemptLog[];
  diagnostics?: EmailRuntimeDiagnostics;
};

type MarketingSendResult = ActionResult & {
  sent?: number;
  failed?: number;
  errors?: string[];
};

export type MarketingEmailRequest = MarketingEmailPayload & {
  recipients: string[];
  segment: "all_customers" | "registered_customers" | "past_order_customers" | "custom";
  isTest?: boolean;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "Authentication required" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return { supabase, error: "Admin access required" };
  }

  return { supabase, userId: user.id };
}

export async function getEmailRuntimeDiagnosticsAction(): Promise<EmailRuntimeDiagnostics | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  return getEmailDeliveryDiagnostics();
}

export async function sendOrderEmailForOrder(orderId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const { supabase } = auth;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message || "Order not found" };
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      quantity,
      unit_price,
      product:products ( name ),
      variant:product_variants ( size )
    `)
    .eq("order_id", orderId);

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  return sendOrderEmail(order, items || []);
}

export async function sendMarketingCampaign(request: MarketingEmailRequest): Promise<MarketingSendResult> {
  const auth = await requireAdmin();
  if (auth.error) return { success: false, error: auth.error };

  const recipients = Array.from(
    new Set(
      request.recipients
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (!request.subject.trim()) return { success: false, error: "Subject is required" };
  if (!request.heading.trim()) return { success: false, error: "Heading is required" };
  if (!request.body.trim()) return { success: false, error: "Body is required" };
  if (recipients.length === 0) return { success: false, error: "At least one recipient is required" };
  if (recipients.length > 500) return { success: false, error: "Recipient limit is 500 per send" };

  const payload: MarketingEmailPayload = {
    subject: request.subject.trim(),
    preheader: request.preheader?.trim(),
    heading: request.heading.trim(),
    body: request.body.trim(),
    heroImageUrl: request.heroImageUrl?.trim(),
    ctaLabel: request.ctaLabel?.trim(),
    ctaUrl: request.ctaUrl?.trim(),
    accentColor: request.accentColor?.trim(),
    footerNote: request.footerNote?.trim(),
  };

  const result = await sendMarketingEmail(payload, recipients);

  try {
    await auth.supabase.from("email_marketing_campaigns").insert({
      subject: payload.subject,
      preheader: payload.preheader || null,
      heading: payload.heading,
      body: payload.body,
      hero_image_url: payload.heroImageUrl || null,
      cta_label: payload.ctaLabel || null,
      cta_url: payload.ctaUrl || null,
      accent_color: payload.accentColor || null,
      footer_note: payload.footerNote || null,
      segment: request.segment,
      recipient_count: recipients.length,
      sent_count: result.sent,
      failed_count: result.failed,
      status: request.isTest ? "test_sent" : result.success ? "sent" : "partial_failure",
      created_by: auth.userId,
      error_log: result.errors.length > 0 ? result.errors.join("\n") : null,
    });
    revalidatePath("/admin/email-marketing");
  } catch (err) {
    console.error("Failed to log marketing campaign:", err);
  }

  return {
    success: result.success,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors,
    logs: result.logs,
    diagnostics: result.diagnostics,
    error: result.success ? undefined : result.errors[0] || "Some emails failed",
  };
}
