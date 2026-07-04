import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";

type StoreEmailSettings = {
  smtp_host?: string | null;
  smtp_port?: number | string | null;
  smtp_user?: string | null;
  smtp_pass?: string | null;
  contact_email?: string | null;
  brand_name?: string | null;
  email_from_address?: string | null;
  email_from_name?: string | null;
};

type EmailProvider = "brevo_api" | "smtp";

type EmailConfig = {
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  brevoApiKey?: string;
  brandName: string;
  supportEmail: string;
  fromAddress: string;
  fromName: string;
  fromSource: "db_email_from_address" | "env_smtp_from" | "env_email_from" | "support_email" | "smtp_user";
};

export type EmailRuntimeDiagnostics = {
  provider: EmailProvider;
  canSend: boolean;
  smtpHost: string | null;
  smtpPort: number;
  hasSmtpUser: boolean;
  hasSmtpPass: boolean;
  hasBrevoApiKey: boolean;
  fromAddress: string | null;
  fromName: string | null;
  fromSource: EmailConfig["fromSource"] | null;
  supportEmail: string | null;
  brandName: string | null;
  issues: string[];
};

export type EmailAttemptLog = {
  recipient: string;
  provider: EmailProvider;
  success: boolean;
  subject: string;
  statusCode?: number;
  providerResponse?: string;
  messageId?: string;
  error?: string;
};

type EmailSendResult = {
  success: boolean;
  error?: string;
  logs?: EmailAttemptLog[];
  diagnostics?: EmailRuntimeDiagnostics;
};

export type MarketingEmailPayload = {
  subject: string;
  preheader?: string;
  heading: string;
  body: string;
  heroImageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accentColor?: string;
  footerNote?: string;
};

const DEFAULT_BRAND_NAME = "Ayraa Collection";
const DEFAULT_SUPPORT_EMAIL = "care@ayraa.pk";
const DEFAULT_ACCENT_COLOR = "#d4af37";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function getSMTPSettings(): Promise<StoreEmailSettings | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    return data as StoreEmailSettings;
  } catch (err) {
    console.error("Failed to load SMTP settings from DB:", err);
    return null;
  }
}

export async function getEmailDeliveryDiagnostics(): Promise<EmailRuntimeDiagnostics> {
  const dbSettings = await getSMTPSettings();
  const smtpHost = firstNonEmpty(dbSettings?.smtp_host, process.env.SMTP_HOST);
  const smtpPort = Number(firstNonEmpty(dbSettings?.smtp_port, process.env.SMTP_PORT, 587));
  const smtpUser = firstNonEmpty(dbSettings?.smtp_user, process.env.SMTP_USER);
  const smtpPass = firstNonEmpty(dbSettings?.smtp_pass, process.env.SMTP_PASS, process.env.SMTP_KEY);
  const brevoApiKey = resolveBrevoApiKey(process.env.BREVO_API_KEY);
  const supportEmail = firstNonEmpty(dbSettings?.contact_email, process.env.SUPPORT_EMAIL, DEFAULT_SUPPORT_EMAIL);
  const brandName = firstNonEmpty(dbSettings?.brand_name, process.env.EMAIL_FROM_NAME, DEFAULT_BRAND_NAME);
  const { fromAddress, fromSource } = resolveFromAddress(dbSettings, supportEmail, smtpUser);
  const provider = chooseProvider(smtpHost, brevoApiKey, smtpUser, smtpPass);
  const issues: string[] = [];

  if (!fromAddress) issues.push("Sender address is missing.");
  if (!supportEmail) issues.push("Support email is missing.");
  if (provider === "brevo_api" && !brevoApiKey) issues.push("Brevo API key is missing.");
  if (provider === "smtp" && (!smtpHost || !smtpUser || !smtpPass)) issues.push("SMTP host, user, or password is missing.");
  if (!dbSettings?.email_from_address && !process.env.SMTP_FROM && !process.env.EMAIL_FROM) {
    issues.push("Sender address is not explicitly configured; fallback sender is being used.");
  }

  return {
    provider,
    canSend: issues.length === 0,
    smtpHost: smtpHost || null,
    smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
    hasSmtpUser: Boolean(smtpUser),
    hasSmtpPass: Boolean(smtpPass),
    hasBrevoApiKey: Boolean(brevoApiKey),
    fromAddress: fromAddress || null,
    fromName: brandName || null,
    fromSource,
    supportEmail: supportEmail || null,
    brandName: brandName || null,
    issues,
  };
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  const dbSettings = await getSMTPSettings();
  const smtpHost = firstNonEmpty(dbSettings?.smtp_host, process.env.SMTP_HOST);
  const smtpPort = Number(firstNonEmpty(dbSettings?.smtp_port, process.env.SMTP_PORT, 587));
  const smtpUser = firstNonEmpty(dbSettings?.smtp_user, process.env.SMTP_USER);
  const smtpPass = firstNonEmpty(dbSettings?.smtp_pass, process.env.SMTP_PASS, process.env.SMTP_KEY);
  const brevoApiKey = resolveBrevoApiKey(process.env.BREVO_API_KEY);
  const brandName = firstNonEmpty(dbSettings?.brand_name, process.env.EMAIL_FROM_NAME, DEFAULT_BRAND_NAME);
  const supportEmail = firstNonEmpty(dbSettings?.contact_email, process.env.SUPPORT_EMAIL, DEFAULT_SUPPORT_EMAIL);
  const { fromAddress, fromSource } = resolveFromAddress(dbSettings, supportEmail, smtpUser);
  const provider = chooseProvider(smtpHost, brevoApiKey, smtpUser, smtpPass);

  if (!fromAddress || !fromSource || !brandName || !supportEmail) {
    console.warn("Email sender, brand name, or support email is not fully configured. Skipping email send.");
    return null;
  }

  if (provider === "brevo_api") {
    if (!brevoApiKey) {
      console.warn("Brevo API provider selected but API key is missing.");
      return null;
    }
  } else if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("SMTP credentials are not fully configured. Skipping email send.");
    return null;
  }

  if (!dbSettings?.email_from_address && !process.env.SMTP_FROM && !process.env.EMAIL_FROM) {
    console.warn("Email sender address is not explicitly configured. Falling back to support email or SMTP login.");
  }

  return {
    provider,
    smtpHost,
    smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
    smtpUser,
    smtpPass,
    brevoApiKey,
    brandName,
    supportEmail,
    fromAddress,
    fromName: firstNonEmpty(dbSettings?.email_from_name, process.env.EMAIL_FROM_NAME, brandName),
    fromSource,
  };
}

function chooseProvider(
  smtpHost: string,
  brevoApiKey: string,
  smtpUser: string,
  smtpPass: string
): EmailProvider {
  if (brevoApiKey && /brevo\.com/i.test(smtpHost || "")) {
    return "brevo_api";
  }
  if (smtpUser && smtpPass) {
    return "smtp";
  }
  return "brevo_api";
}

function resolveBrevoApiKey(value: string | undefined) {
  const key = String(value || "").trim();
  return /^xkeysib-/i.test(key) ? key : "";
}

function resolveFromAddress(
  dbSettings: StoreEmailSettings | null,
  supportEmail: string,
  smtpUser: string
): { fromAddress: string; fromSource: EmailConfig["fromSource"] | null } {
  if (nonEmpty(dbSettings?.email_from_address)) {
    return { fromAddress: String(dbSettings?.email_from_address).trim(), fromSource: "db_email_from_address" };
  }
  if (nonEmpty(process.env.SMTP_FROM)) {
    return { fromAddress: String(process.env.SMTP_FROM).trim(), fromSource: "env_smtp_from" };
  }
  if (nonEmpty(process.env.EMAIL_FROM)) {
    return { fromAddress: String(process.env.EMAIL_FROM).trim(), fromSource: "env_email_from" };
  }
  if (nonEmpty(supportEmail)) {
    return { fromAddress: String(supportEmail).trim(), fromSource: "support_email" };
  }
  if (nonEmpty(smtpUser)) {
    return { fromAddress: String(smtpUser).trim(), fromSource: "smtp_user" };
  }
  return { fromAddress: "", fromSource: null };
}

function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
}

function firstNonEmpty<T>(...values: Array<T | null | undefined | "">): T {
  return values.find((value) => nonEmpty(value)) as T;
}

function nonEmpty(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function formatAddress(name: string, address: string) {
  return `"${name.replace(/"/g, "'")}" <${address}>`;
}

function isValidEmail(email: string | null | undefined) {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPKR(amount: unknown) {
  return `PKR ${Math.round(Number(amount) || 0).toLocaleString("en-PK")}`;
}

function buildTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildOrderEmailHtml(order: any, items: any[], config: EmailConfig) {
  const shippingAddress = order.shipping_address || {};
  const itemRows = items
    .map((item) => {
      const productName = escapeHtml(item.product?.name || item.name || "Product");
      const size = item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
        ? `<br/><span style="font-size:12px; color:#666;">Size: ${escapeHtml(item.variant.size)}</span>`
        : "";
      const color = item.variant?.color && item.variant.color !== "Standard"
        ? `<br/><span style="font-size:12px; color:#666;">Color: ${escapeHtml(item.variant.color)}</span>`
        : "";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #333;">
            <strong>${productName}</strong>${size}${color}
          </td>
          <td style="padding: 12px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #666;">
            ${escapeHtml(item.quantity)}
          </td>
          <td style="padding: 12px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #333; font-weight: bold;">
            ${formatPKR(Number(item.unit_price) * Number(item.quantity))}
          </td>
        </tr>`;
    })
    .join("");

  const customerName = firstNonEmpty(shippingAddress.first_name, "Customer");
  const recipientName = [shippingAddress.first_name, shippingAddress.last_name].filter(Boolean).join(" ");
  const addressLineTwo = shippingAddress.address_line_2 ? `, ${escapeHtml(shippingAddress.address_line_2)}` : "";
  const paymentMethod = String(order.payment_method || "cod").replace(/_/g, " ").toUpperCase();

  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; padding: 40px; font-family: Arial, sans-serif; border-top: 4px solid ${DEFAULT_ACCENT_COLOR};">
      <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 26px; font-weight: normal; color: #111; letter-spacing: 2px; margin: 0; text-transform: uppercase; font-family: Georgia, serif;">
          ${escapeHtml(config.brandName)}
        </h1>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin: 5px 0 0 0; font-weight: 600;">
          Order Confirmation
        </p>
      </div>

      <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
        Dear ${escapeHtml(customerName)},
      </p>
      <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
        Thank you for placing your order with <strong>${escapeHtml(config.brandName)}</strong>. We have received your order and will contact you shortly for confirmation.
      </p>

      <div style="background-color: #fafafa; border: 1px solid #f0f0f0; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
        <h3 style="margin-top: 0; color: ${DEFAULT_ACCENT_COLOR}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-family: Georgia, serif;">
          Order Reference
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #555;">
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Order ID:</td>
            <td style="padding: 4px 0; text-align: right; color: #111; font-weight: bold;">#${escapeHtml(order.id)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Date Placed:</td>
            <td style="padding: 4px 0; text-align: right;">${new Date(order.created_at || new Date()).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Payment Method:</td>
            <td style="padding: 4px 0; text-align: right;">${escapeHtml(paymentMethod)}</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="border-bottom: 2px solid #eee;">
            <th style="padding: 8px 0; text-align: left; font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px;">Item Details</th>
            <th style="padding: 8px 0; text-align: center; font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px; width: 60px;">Qty</th>
            <th style="padding: 8px 0; text-align: right; font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; letter-spacing: 0.5px; width: 100px;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="width: 260px; margin-left: auto; margin-bottom: 35px; font-size: 14px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666;">Subtotal:</td>
            <td style="padding: 6px 0; text-align: right; color: #333;">${formatPKR(order.subtotal)}</td>
          </tr>
          ${
            Number(order.discount_amount) > 0
              ? `<tr>
                  <td style="padding: 6px 0; color: ${DEFAULT_ACCENT_COLOR}; font-weight: bold;">Discount:</td>
                  <td style="padding: 6px 0; text-align: right; color: ${DEFAULT_ACCENT_COLOR}; font-weight: bold;">-${formatPKR(order.discount_amount)}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #666; border-bottom: 1px solid #eee;">Shipping Cost:</td>
            <td style="padding: 6px 0; text-align: right; color: #333; border-bottom: 1px solid #eee;">
              ${Number(order.shipping_cost) === 0 ? "FREE" : formatPKR(order.shipping_cost)}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: bold; font-size: 15px; color: #111;">Total Amount:</td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px; color: ${DEFAULT_ACCENT_COLOR};">${formatPKR(order.total)}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #555; line-height: 1.5; margin-bottom: 40px;">
        <h4 style="margin-top: 0; color: #111; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; margin-bottom: 8px; font-family: Georgia, serif;">
          Delivery Details
        </h4>
        <p style="margin: 0;">
          <strong>Recipient:</strong> ${escapeHtml(recipientName || "Customer")}<br />
          <strong>Address:</strong> ${escapeHtml(shippingAddress.address_line_1)}${addressLineTwo}<br />
          <strong>Destination:</strong> ${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} - ${escapeHtml(shippingAddress.postal_code)}<br />
          <strong>Contact Phone:</strong> ${escapeHtml(order.contact_phone)}
        </p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 11px; color: #999; line-height: 1.4;">
        <p style="margin: 0;">
          This order confirmation is sent automatically. For support, email <a href="mailto:${escapeHtml(config.supportEmail)}" style="color: ${DEFAULT_ACCENT_COLOR}; text-decoration: none; font-weight: 600;">${escapeHtml(config.supportEmail)}</a>.
        </p>
        <p style="margin: 6px 0 0 0;">
          &copy; ${new Date().getFullYear()} ${escapeHtml(config.brandName)}. All rights reserved.
        </p>
      </div>
    </div>`;
}

export function buildMarketingEmailHtml(payload: MarketingEmailPayload, brandName = DEFAULT_BRAND_NAME, supportEmail = DEFAULT_SUPPORT_EMAIL) {
  const accentColor = payload.accentColor && /^#[0-9a-fA-F]{6}$/.test(payload.accentColor)
    ? payload.accentColor
    : DEFAULT_ACCENT_COLOR;
  const paragraphs = payload.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="font-size: 15px; color: #444; line-height: 1.7; margin: 0 0 18px;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const hero = payload.heroImageUrl
    ? `<img src="${escapeHtml(payload.heroImageUrl)}" alt="" style="width: 100%; display: block; border: 0; margin: 0 0 28px;" />`
    : "";
  const cta = payload.ctaLabel && payload.ctaUrl
    ? `<div style="text-align: center; margin: 30px 0 10px;">
        <a href="${escapeHtml(payload.ctaUrl)}" style="display: inline-block; background: ${accentColor}; color: #111; text-decoration: none; padding: 13px 24px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 12px;">
          ${escapeHtml(payload.ctaLabel)}
        </a>
      </div>`
    : "";
  const footerNote = payload.footerNote
    ? `<p style="margin: 12px 0 0; color: #777;">${escapeHtml(payload.footerNote)}</p>`
    : "";

  return `
    <div style="background: #f7f3ec; padding: 24px 12px; font-family: Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dcc8;">
        <div style="padding: 30px 34px 22px; text-align: center; border-top: 5px solid ${accentColor};">
          <div style="font-family: Georgia, serif; font-size: 28px; letter-spacing: 0.16em; color: #111; text-transform: uppercase;">${escapeHtml(brandName)}</div>
          ${payload.preheader ? `<div style="margin-top: 8px; color: #8a7a5c; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(payload.preheader)}</div>` : ""}
        </div>
        ${hero}
        <div style="padding: 0 34px 34px;">
          <h1 style="font-family: Georgia, serif; font-size: 30px; line-height: 1.2; font-weight: 400; color: #111; margin: 0 0 18px;">
            ${escapeHtml(payload.heading)}
          </h1>
          ${paragraphs}
          ${cta}
        </div>
        <div style="padding: 18px 34px 28px; border-top: 1px solid #eee6d8; color: #999; font-size: 11px; line-height: 1.5; text-align: center;">
          <p style="margin: 0;">You are receiving this email because you shopped with ${escapeHtml(brandName)} or shared your email with us.</p>
          <p style="margin: 8px 0 0;">For support or opt-out requests, contact <a href="mailto:${escapeHtml(supportEmail)}" style="color: ${accentColor};">${escapeHtml(supportEmail)}</a>.</p>
          ${footerNote}
        </div>
      </div>
    </div>`;
}

export async function sendOrderEmail(order: any, items: any[]): Promise<EmailSendResult> {
  const config = await getEmailConfig();
  const diagnostics = await getEmailDeliveryDiagnostics();
  if (!config) return { success: false, error: "Email provider is not fully configured", diagnostics };

  const html = buildOrderEmailHtml(order, items, config);
  const text = buildTextFromHtml(html);
  const customerEmail = String(order.contact_email || "").trim();
  const adminEmail = String(process.env.ORDER_NOTIFICATION_EMAIL || config.supportEmail).trim();
  const logs: EmailAttemptLog[] = [];

  if (isValidEmail(customerEmail)) {
    logs.push(
      await sendSingleEmail({
        config,
        recipient: customerEmail,
        subject: `Order Confirmation #${order.id} - ${config.brandName}`,
        html,
        text,
        replyToEmail: config.supportEmail,
        replyToName: config.fromName,
      })
    );
  } else {
    logs.push({
      recipient: customerEmail || "(missing)",
      provider: config.provider,
      success: false,
      subject: `Order Confirmation #${order.id} - ${config.brandName}`,
      error: "Invalid customer email address",
    });
  }

  if (isValidEmail(adminEmail)) {
    logs.push(
      await sendSingleEmail({
        config,
        recipient: adminEmail,
        subject: `[New Order Alert] #${order.id}`,
        html,
        text,
        replyToEmail: isValidEmail(customerEmail) ? customerEmail : config.supportEmail,
        replyToName: isValidEmail(customerEmail) ? customerEmail : config.fromName,
      })
    );
  }

  const failures = logs.filter((log) => !log.success);
  if (failures.length > 0) {
    const error = failures.map((failure) => `${failure.recipient}: ${failure.error || "failed"}`).join("; ");
    console.error(`Order email failed for #${order.id}:`, error);
    return { success: false, error, logs, diagnostics };
  }

  console.log(`Order emails successfully sent for Order #${order.id}`);
  return { success: true, logs, diagnostics };
}

export async function sendMarketingEmail(
  payload: MarketingEmailPayload,
  recipients: string[]
): Promise<{ success: boolean; sent: number; failed: number; errors: string[]; logs: EmailAttemptLog[]; diagnostics: EmailRuntimeDiagnostics }> {
  const diagnostics = await getEmailDeliveryDiagnostics();
  const config = await getEmailConfig();
  if (!config) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      errors: ["Email provider is not fully configured"],
      logs: [],
      diagnostics,
    };
  }

  const uniqueRecipients = Array.from(
    new Set(recipients.map((recipient) => recipient.trim().toLowerCase()).filter(isValidEmail))
  );
  if (uniqueRecipients.length === 0) {
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      errors: ["No valid recipient email addresses"],
      logs: [],
      diagnostics,
    };
  }

  const html = buildMarketingEmailHtml(payload, config.brandName, config.supportEmail);
  const text = buildTextFromHtml(html);
  const logs: EmailAttemptLog[] = [];

  for (const recipient of uniqueRecipients) {
    logs.push(
      await sendSingleEmail({
        config,
        recipient,
        subject: payload.subject,
        html,
        text,
        replyToEmail: config.supportEmail,
        replyToName: config.fromName,
      })
    );
  }

  const sent = logs.filter((log) => log.success).length;
  const failures = logs.filter((log) => !log.success);

  return {
    success: failures.length === 0,
    sent,
    failed: uniqueRecipients.length - sent,
    errors: failures.map((failure) => `${failure.recipient}: ${failure.error || "failed"}`),
    logs,
    diagnostics,
  };
}

async function sendSingleEmail({
  config,
  recipient,
  subject,
  html,
  text,
  replyToEmail,
  replyToName,
}: {
  config: EmailConfig;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  replyToEmail: string;
  replyToName: string;
}): Promise<EmailAttemptLog> {
  if (config.provider === "brevo_api") {
    return sendViaBrevoApi({ config, recipient, subject, html, text, replyToEmail, replyToName });
  }
  return sendViaSmtp({ config, recipient, subject, html, text, replyToEmail, replyToName });
}

async function sendViaSmtp({
  config,
  recipient,
  subject,
  html,
  text,
  replyToEmail,
  replyToName,
}: {
  config: EmailConfig;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  replyToEmail: string;
  replyToName: string;
}): Promise<EmailAttemptLog> {
  const transporter = createTransporter(config);
  const from = formatAddress(config.fromName, config.fromAddress);

  try {
    const info = await transporter.sendMail({
      from,
      replyTo: formatAddress(replyToName, replyToEmail),
      to: recipient,
      subject,
      html,
      text,
    });

    return {
      recipient,
      provider: "smtp",
      success: true,
      subject,
      messageId: info.messageId,
      providerResponse: info.response,
    };
  } catch (err: any) {
    return {
      recipient,
      provider: "smtp",
      success: false,
      subject,
      statusCode: err.responseCode,
      providerResponse: err.response,
      error: err.message || "SMTP send failed",
    };
  }
}

async function sendViaBrevoApi({
  config,
  recipient,
  subject,
  html,
  text,
  replyToEmail,
  replyToName,
}: {
  config: EmailConfig;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  replyToEmail: string;
  replyToName: string;
}): Promise<EmailAttemptLog> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": config.brevoApiKey || "",
      },
      body: JSON.stringify({
        sender: {
          name: config.fromName,
          email: config.fromAddress,
        },
        to: [{ email: recipient }],
        replyTo: {
          email: replyToEmail,
          name: replyToName,
        },
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const bodyText = await response.text();
    let parsed: { messageId?: string; code?: string; message?: string } = {};

    try {
      parsed = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      parsed = {};
    }

    if (!response.ok) {
      return {
        recipient,
        provider: "brevo_api",
        success: false,
        subject,
        statusCode: response.status,
        providerResponse: bodyText,
        error: parsed.message || `Brevo API send failed with status ${response.status}`,
      };
    }

    return {
      recipient,
      provider: "brevo_api",
      success: true,
      subject,
      statusCode: response.status,
      providerResponse: bodyText,
      messageId: parsed.messageId,
    };
  } catch (err: any) {
    return {
      recipient,
      provider: "brevo_api",
      success: false,
      subject,
      error: err.message || "Brevo API request failed",
    };
  }
}
