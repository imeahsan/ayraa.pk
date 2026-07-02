"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getEmailRuntimeDiagnosticsAction, sendMarketingCampaign } from "@/app/actions/email";
import { Button } from "@/components/storefront/Button/Button";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

type Segment = "all_customers" | "registered_customers" | "past_order_customers" | "custom";

type CampaignForm = {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  heroImageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  accentColor: string;
  footerNote: string;
};

type CampaignLog = {
  id: string;
  subject: string;
  segment: Segment;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
};

type EmailAttemptLog = {
  recipient: string;
  provider: "brevo_api" | "smtp";
  success: boolean;
  subject: string;
  statusCode?: number;
  providerResponse?: string;
  messageId?: string;
  error?: string;
};

type EmailDiagnostics = {
  provider: "brevo_api" | "smtp";
  canSend: boolean;
  smtpHost: string | null;
  smtpPort: number;
  hasSmtpUser: boolean;
  hasSmtpPass: boolean;
  hasBrevoApiKey: boolean;
  fromAddress: string | null;
  fromName: string | null;
  fromSource: string | null;
  supportEmail: string | null;
  brandName: string | null;
  issues: string[];
};

const DEFAULT_FORM: CampaignForm = {
  subject: "New arrivals at Ayraa",
  preheader: "Fresh pieces curated for your wardrobe",
  heading: "A refined new edit has arrived",
  body: "Discover fresh silhouettes, seasonal textures, and polished everyday pieces from Ayraa.\n\nShop the latest collection before sizes sell out.",
  heroImageUrl: "",
  ctaLabel: "Shop New Arrivals",
  ctaUrl: "https://ayraa.pk/collections",
  accentColor: "#d4af37",
  footerNote: "",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
  );
}

function buildPreviewHtml(form: CampaignForm) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#d4af37";
  const paragraphs = form.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 18px;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const hero = form.heroImageUrl
    ? `<img src="${escapeHtml(form.heroImageUrl)}" alt="" style="width: 100%; display: block; border: 0; margin: 0 0 28px;" />`
    : "";
  const cta = form.ctaLabel && form.ctaUrl
    ? `<div style="text-align: center; margin: 30px 0 10px;"><a href="${escapeHtml(form.ctaUrl)}" style="display: inline-block; background: ${accent}; color: #111; text-decoration: none; padding: 13px 24px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 12px;">${escapeHtml(form.ctaLabel)}</a></div>`
    : "";

  return `
    <div style="background: #f7f3ec; padding: 24px 12px; font-family: Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dcc8;">
        <div style="padding: 30px 34px 22px; text-align: center; border-top: 5px solid ${accent};">
          <div style="font-family: Georgia, serif; font-size: 28px; letter-spacing: 0.16em; color: #111; text-transform: uppercase;">Ayraa Collection</div>
          ${form.preheader ? `<div style="margin-top: 8px; color: #8a7a5c; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(form.preheader)}</div>` : ""}
        </div>
        ${hero}
        <div style="padding: 0 34px 34px;">
          <h1 style="font-family: Georgia, serif; font-size: 30px; line-height: 1.2; font-weight: 400; color: #111; margin: 0 0 18px;">${escapeHtml(form.heading)}</h1>
          ${paragraphs}
          ${cta}
        </div>
        <div style="padding: 18px 34px 28px; border-top: 1px solid #eee6d8; color: #999; font-size: 11px; line-height: 1.5; text-align: center;">
          <p style="margin: 0;">You are receiving this email because you shopped with Ayraa Collection or shared your email with us.</p>
          <p style="margin: 8px 0 0;">For support or opt-out requests, contact care@ayraa.pk.</p>
          ${form.footerNote ? `<p style="margin: 12px 0 0; color: #777;">${escapeHtml(form.footerNote)}</p>` : ""}
        </div>
      </div>
    </div>`;
}

export default function AdminEmailMarketingPage() {
  const supabase = createClient();
  const toast = useToast();
  const [form, setForm] = useState<CampaignForm>(DEFAULT_FORM);
  const [segment, setSegment] = useState<Segment>("all_customers");
  const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);
  const [orderEmails, setOrderEmails] = useState<string[]>([]);
  const [customRecipients, setCustomRecipients] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [lastLogs, setLastLogs] = useState<EmailAttemptLog[]>([]);
  const [lastDiagnostics, setLastDiagnostics] = useState<EmailDiagnostics | null>(null);
  const [lastSendSummary, setLastSendSummary] = useState<string>("");

  useEffect(() => {
    async function loadEmailData() {
      try {
        const [profilesRes, ordersRes, campaignsRes] = await Promise.all([
          supabase.from("profiles").select("email").eq("role", "customer"),
          supabase.from("orders").select("contact_email"),
          supabase
            .from("email_marketing_campaigns")
            .select("id, subject, segment, recipient_count, sent_count, failed_count, status, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        if (!profilesRes.error) {
          setRegisteredEmails(parseEmails((profilesRes.data || []).map((row: any) => row.email).join(",")));
        }
        if (!ordersRes.error) {
          setOrderEmails(parseEmails((ordersRes.data || []).map((row: any) => row.contact_email).join(",")));
        }
        if (!campaignsRes.error) {
          setCampaigns((campaignsRes.data || []) as CampaignLog[]);
        }

        const diagnostics = await getEmailRuntimeDiagnosticsAction();
        if (!("error" in diagnostics)) {
          setLastDiagnostics(diagnostics);
        }
      } catch (err) {
        console.error("Failed to load marketing email data:", err);
      } finally {
        setLoadingRecipients(false);
      }
    }

    loadEmailData();
  }, [supabase]);

  const selectedRecipients = useMemo(() => {
    if (segment === "registered_customers") return registeredEmails;
    if (segment === "past_order_customers") return orderEmails;
    if (segment === "custom") return parseEmails(customRecipients);
    return Array.from(new Set([...registeredEmails, ...orderEmails]));
  }, [customRecipients, orderEmails, registeredEmails, segment]);

  const previewHtml = useMemo(() => buildPreviewHtml(form), [form]);

  const updateField = (field: keyof CampaignForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const sendTest = async () => {
    if (!testEmail.trim()) {
      toast.warning("Enter a test recipient email first.");
      return;
    }
    setSendingTest(true);
    const result = await sendMarketingCampaign({
      ...form,
      recipients: [testEmail],
      segment: "custom",
      isTest: true,
    });
    setSendingTest(false);
    setLastLogs((result.logs || []) as EmailAttemptLog[]);
    setLastDiagnostics((result.diagnostics || null) as EmailDiagnostics | null);
    setLastSendSummary(
      result.success
        ? `Test send completed. Sent ${result.sent || 0}, failed ${result.failed || 0}.`
        : `Test send failed. Sent ${result.sent || 0}, failed ${result.failed || 0}.`
    );

    if (result.success) {
      toast.success(`Test email sent to ${testEmail}.`);
    } else {
      toast.error(result.error || "Test email failed.");
    }
  };

  const sendCampaign = async () => {
    if (selectedRecipients.length === 0) {
      toast.warning("No recipients selected.");
      return;
    }
    if (!confirm(`Send this campaign to ${selectedRecipients.length} recipient(s)?`)) return;

    setSending(true);
    const result = await sendMarketingCampaign({
      ...form,
      recipients: selectedRecipients,
      segment,
    });
    setSending(false);
    setLastLogs((result.logs || []) as EmailAttemptLog[]);
    setLastDiagnostics((result.diagnostics || null) as EmailDiagnostics | null);
    setLastSendSummary(
      result.success
        ? `Campaign completed. Sent ${result.sent || 0}, failed ${result.failed || 0}.`
        : `Campaign completed with failures. Sent ${result.sent || 0}, failed ${result.failed || 0}.`
    );

    if (result.success) {
      toast.success(`Campaign sent to ${result.sent || 0} recipient(s).`);
    } else {
      toast.error(result.error || `Campaign completed with ${result.failed || 0} failure(s).`);
    }
  };

  return (
    <div className={styles.pageLayout}>
      <div className={styles.twoColLayout}>
        <div className={styles.mainFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Campaign Design</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subject</label>
              <input className={styles.formInput} value={form.subject} onChange={(e) => updateField("subject", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Preheader</label>
              <input className={styles.formInput} value={form.preheader} onChange={(e) => updateField("preheader", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hero Image URL</label>
              <input className={styles.formInput} placeholder="https://..." value={form.heroImageUrl} onChange={(e) => updateField("heroImageUrl", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Heading</label>
              <input className={styles.formInput} value={form.heading} onChange={(e) => updateField("heading", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Body</label>
              <textarea className={styles.formTextarea} rows={8} value={form.body} onChange={(e) => updateField("body", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CTA Label</label>
                <input className={styles.formInput} value={form.ctaLabel} onChange={(e) => updateField("ctaLabel", e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CTA URL</label>
                <input className={styles.formInput} value={form.ctaUrl} onChange={(e) => updateField("ctaUrl", e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Accent</label>
                <input className={styles.formInput} type="color" value={form.accentColor} onChange={(e) => updateField("accentColor", e.target.value)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Footer Note</label>
              <input className={styles.formInput} value={form.footerNote} onChange={(e) => updateField("footerNote", e.target.value)} />
            </div>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Email Preview</h3>
            <iframe
              title="Marketing email preview"
              srcDoc={previewHtml}
              style={{ width: "100%", minHeight: "720px", border: "1px solid var(--admin-border)", background: "#fff" }}
            />
          </div>
        </div>

        <div className={styles.sidebarFormCol}>
          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Recipients</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Segment</label>
              <select className={styles.formSelect} value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
                <option value="all_customers">All customer emails</option>
                <option value="registered_customers">Registered customers</option>
                <option value="past_order_customers">Past order customers</option>
                <option value="custom">Custom recipients</option>
              </select>
            </div>
            {segment === "custom" && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Custom Emails</label>
                <textarea
                  className={styles.formTextarea}
                  rows={7}
                  placeholder="email@example.com, another@example.com"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                />
              </div>
            )}
            <div className={styles.card} style={{ padding: "16px" }}>
              <span className={styles.cardLabel}>Selected Recipients</span>
              <strong className={styles.cardValue}>{loadingRecipients ? "..." : selectedRecipients.length}</strong>
              <span className={styles.reportSummaryText}>Limit: 500 recipients per send.</span>
            </div>
            <Button type="button" variant="luxury" size="lg" fullWidth isLoading={sending} onClick={sendCampaign}>
              Send Campaign
            </Button>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Send Test</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Test Recipient</label>
              <input className={styles.formInput} type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
            </div>
            <Button type="button" variant="outline" fullWidth isLoading={sendingTest} onClick={sendTest}>
              Send Test Email
            </Button>
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Send Diagnostics</h3>
            {lastSendSummary ? (
              <p className={styles.reportSummaryText} style={{ marginBottom: "14px" }}>{lastSendSummary}</p>
            ) : (
              <p className={styles.reportSummaryText} style={{ marginBottom: "14px" }}>Run a test send to inspect Brevo or SMTP responses.</p>
            )}

            <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: "var(--admin-text-sub)" }}>
              <div>Provider: {lastDiagnostics?.provider === "brevo_api" ? "Brevo API" : "SMTP"}</div>
              <div>Sender: {lastDiagnostics?.fromAddress || "Not resolved"}</div>
              <div>Sender source: {lastDiagnostics?.fromSource || "Unknown"}</div>
              <div>Support email: {lastDiagnostics?.supportEmail || "Not set"}</div>
              <div>Brevo API key present: {lastDiagnostics?.hasBrevoApiKey ? "Yes" : "No"}</div>
              <div>SMTP login present: {lastDiagnostics?.hasSmtpUser ? "Yes" : "No"}</div>
              <div>SMTP/API secret present: {lastDiagnostics?.hasSmtpPass ? "Yes" : "No"}</div>
            </div>

            {lastDiagnostics && lastDiagnostics.issues.length > 0 ? (
              <div style={{ marginTop: "14px", padding: "12px", border: "1px solid var(--admin-border)", background: "rgba(255,255,255,0.03)" }}>
                {lastDiagnostics.issues.map((issue) => (
                  <div key={issue} className={styles.reportSummaryText} style={{ marginTop: "6px" }}>
                    {issue}
                  </div>
                ))}
              </div>
            ) : null}

            {lastLogs.length > 0 ? (
              <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
                {lastLogs.map((log, index) => (
                  <div key={`${log.recipient}-${index}`} style={{ border: "1px solid var(--admin-border)", padding: "12px", background: "rgba(255,255,255,0.03)" }}>
                    <strong style={{ display: "block", color: "var(--admin-text)", fontSize: "12px" }}>{log.recipient}</strong>
                    <div className={styles.reportSummaryText} style={{ marginTop: "6px" }}>Status: {log.success ? "Sent" : "Failed"}</div>
                    <div className={styles.reportSummaryText}>Provider: {log.provider === "brevo_api" ? "Brevo API" : "SMTP"}</div>
                    <div className={styles.reportSummaryText}>Subject: {log.subject}</div>
                    {log.statusCode ? <div className={styles.reportSummaryText}>HTTP/SMTP code: {log.statusCode}</div> : null}
                    {log.messageId ? <div className={styles.reportSummaryText}>Message ID: {log.messageId}</div> : null}
                    {log.error ? <div className={styles.reportSummaryText}>Error: {log.error}</div> : null}
                    {log.providerResponse ? (
                      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "8px", padding: "10px", fontSize: "11px", color: "var(--admin-text-sub)", background: "rgba(0,0,0,0.18)", border: "1px solid var(--admin-border)" }}>
                        {log.providerResponse}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.formCard}>
            <h3 className={styles.formCardTitle}>Recent Campaigns</h3>
            {campaigns.length === 0 ? (
              <p className={styles.reportSummaryText}>No campaign history found.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} style={{ borderBottom: "1px solid var(--admin-border)", paddingBottom: "12px", marginBottom: "12px" }}>
                  <strong style={{ display: "block", color: "var(--admin-text)", fontSize: "13px" }}>{campaign.subject}</strong>
                  <span style={{ display: "block", color: "var(--admin-text-sub)", fontSize: "11px", marginTop: "4px" }}>
                    {campaign.status} | sent {campaign.sent_count}/{campaign.recipient_count} | failed {campaign.failed_count}
                  </span>
                  <span style={{ display: "block", color: "var(--admin-text-sub)", fontSize: "11px", marginTop: "2px" }}>
                    {new Date(campaign.created_at).toLocaleString("en-PK")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
