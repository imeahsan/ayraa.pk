import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

/**
 * Fetches SMTP server configuration from the database store_settings.
 */
export async function getSMTPSettings() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("smtp_host, smtp_port, smtp_user, smtp_pass, contact_email, brand_name")
      .eq("id", 1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to load SMTP settings from DB:", err);
    return null;
  }
}

/**
 * Sends order confirmation emails to the customer and a notification copy to the store admin.
 */
export async function sendOrderEmail(order: any, items: any[]) {
  try {
    const dbSettings = await getSMTPSettings();
    
    // Resolve SMTP settings, fallback to environment variables
    const smtpHost = dbSettings?.smtp_host || process.env.SMTP_HOST;
    const smtpPort = Number(dbSettings?.smtp_port || process.env.SMTP_PORT || 587);
    const smtpUser = dbSettings?.smtp_user || process.env.SMTP_USER;
    const smtpPass = dbSettings?.smtp_pass || process.env.SMTP_PASS;

    const brandName = dbSettings?.brand_name || "Ayraa Collection";
    const supportEmail = dbSettings?.contact_email || "care@ayraacollection.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("SMTP credentials are not fully configured in database or env. Skipping order email.");
      return { success: false, error: "SMTP credentials not configured" };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL for 465, TLS/StartTLS for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Generate table rows for order items
    const itemsHtml = items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; font-family: sans-serif; font-size: 14px; color: #333;">
          <strong>${item.product?.name || "Product"}</strong>
          ${
            item.variant?.size && !["Standard", "One Size", "OS"].includes(item.variant.size)
              ? `<br/><span style="font-size:12px; color:#666;">Size: ${item.variant.size}</span>`
              : ""
          }
          ${
            item.variant?.color && item.variant.color !== "Standard"
              ? `<br/><span style="font-size:12px; color:#666;">Color: ${item.variant.color}</span>`
              : ""
          }
        </td>
        <td style="padding: 12px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #666;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #333; font-weight: bold;">
          PKR ${Math.round(item.unit_price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
      )
      .join("");

    const formatPKR = (amount: number) => `PKR ${Math.round(amount).toLocaleString()}`;

    // Premium custom HTML template matching Ayraa aesthetics
    const htmlBody = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; padding: 40px; font-family: sans-serif; border-top: 4px solid #d4af37;">
        <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 26px; font-weight: normal; color: #111; letter-spacing: 2px; margin: 0; text-transform: uppercase; font-family: Georgia, serif;">
            ${brandName}
          </h1>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin: 5px 0 0 0; font-weight: 600;">
            Order Confirmation
          </p>
        </div>

        <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
          Dear ${order.shipping_address?.first_name || "Customer"},
        </p>
        <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
          Thank you for placing your order with <strong>${brandName}</strong>. We are pleased to confirm that we have received your request. Your order details are summarized below.
        </p>

        <div style="background-color: #fafafa; border: 1px solid #f0f0f0; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #d4af37; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-family: Georgia, serif;">
            Order Reference
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #555;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Order ID:</td>
              <td style="padding: 4px 0; text-align: right; color: #111; font-weight: bold;">#${order.id}</td>
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
              <td style="padding: 4px 0; text-align: right; text-transform: uppercase;">Cash on Delivery (COD)</td>
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
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="width: 260px; margin-left: auto; margin-bottom: 35px; font-size: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666;">Subtotal:</td>
              <td style="padding: 6px 0; text-align: right; color: #333;">${formatPKR(order.subtotal)}</td>
            </tr>
            ${
              order.discount_amount > 0
                ? `
            <tr>
              <td style="padding: 6px 0; color: #d4af37; font-weight: bold;">Discount:</td>
              <td style="padding: 6px 0; text-align: right; color: #d4af37; font-weight: bold;">-${formatPKR(
                order.discount_amount
              )}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 6px 0; color: #666; border-bottom: 1px solid #eee;">Shipping Cost:</td>
              <td style="padding: 6px 0; text-align: right; color: #333; border-bottom: 1px solid #eee;">${
                order.shipping_cost === 0 ? "FREE" : formatPKR(order.shipping_cost)
              }</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; font-size: 15px; color: #111;">Total Amount:</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px; color: #d4af37;">${formatPKR(
                order.total
              )}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 13px; color: #555; line-height: 1.5; margin-bottom: 40px;">
          <h4 style="margin-top: 0; color: #111; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; margin-bottom: 8px; font-family: Georgia, serif;">
            Delivery Details
          </h4>
          <p style="margin: 0;">
            <strong>Recipient:</strong> ${order.shipping_address?.first_name} ${order.shipping_address?.last_name}<br />
            <strong>Address:</strong> ${order.shipping_address?.address_line_1}
            ${order.shipping_address?.address_line_2 ? `, ${order.shipping_address.address_line_2}` : ""}<br />
            <strong>Destination:</strong> ${order.shipping_address?.city}, ${order.shipping_address?.state} - ${
      order.shipping_address?.postal_code
    }<br />
            <strong>Contact Phone:</strong> ${order.contact_phone}
          </p>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 11px; color: #999; line-height: 1.4;">
          <p style="margin: 0;">
            This order confirmation is sent automatically. If you have any inquiries, please connect with us at <a href="mailto:${supportEmail}" style="color: #d4af37; text-decoration: none; font-weight: 600;">${supportEmail}</a>.
          </p>
          <p style="margin: 6px 0 0 0;">
            &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const senderEmail = "info@ayraa.pk";

    // Send to Customer
    await transporter.sendMail({
      from: `"${brandName}" <${senderEmail}>`,
      to: order.contact_email,
      subject: `Order Confirmation #${order.id} - ${brandName}`,
      html: htmlBody,
    });

    // Send copy to Store support email
    if (supportEmail) {
      await transporter.sendMail({
        from: `"${brandName} Store Notification" <${senderEmail}>`,
        to: supportEmail,
        subject: `[New Order Alert] #${order.id} - ${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
        html: htmlBody,
      });
    }

    console.log(`Order emails successfully sent for Order #${order.id}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send order email via SMTP:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}
