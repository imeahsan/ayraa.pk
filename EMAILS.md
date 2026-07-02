# Email Inventory

This document lists every application email sent by the Ayraa frontend codebase.

## Delivery Configuration

Email sending is centralized in `src/lib/email.ts`.

Configuration priority:

1. `store_settings` table fields from Admin > Settings.
2. Environment variable fallbacks.

Delivery providers:

- Brevo HTTP API when a Brevo host is configured and an API key is available.
- SMTP relay for standard SMTP credentials.

Supported settings:

| Setting | Purpose |
| --- | --- |
| `smtp_host` / `SMTP_HOST` | SMTP server host. |
| `smtp_port` / `SMTP_PORT` | SMTP port. Port `465` uses secure SMTP, other ports use STARTTLS. |
| `smtp_user` / `SMTP_USER` | SMTP username or provider login. |
| `smtp_pass` / `SMTP_PASS` | SMTP password or provider API key. |
| `BREVO_API_KEY` / `SMTP_KEY` | Preferred Brevo API key fallback for direct API delivery. |
| `email_from_address` / `SMTP_FROM` / `EMAIL_FROM` | Sender email address. |
| `email_from_name` / `EMAIL_FROM_NAME` | Sender display name. |
| `contact_email` / `SUPPORT_EMAIL` | Support email and reply-to fallback, typically `care@ayraa.pk`. |
| `ORDER_NOTIFICATION_EMAIL` | Optional destination for admin order alerts. Falls back to support email. |

Sender address resolution order:

1. `store_settings.email_from_address`
2. `SMTP_FROM`
3. `EMAIL_FROM`
4. `store_settings.contact_email` or `SUPPORT_EMAIL`
5. `smtp_user` / `SMTP_USER`

## Order Confirmation Email

Trigger:

- Customer checkout order placement in `src/app/actions/orders.ts`.
- Admin POS order placement and offline POS order sync in `src/app/admin/pos/POSClient.tsx` through `src/app/actions/email.ts`.

Recipients:

- Customer email from `orders.contact_email`.

Subject:

- `Order Confirmation #{order.id} - {brandName}`

Template source:

- `buildOrderEmailHtml()` in `src/lib/email.ts`.

Content:

- Brand header.
- Order ID, order date, payment method.
- Order item table.
- Subtotal, discount, shipping, total.
- Delivery address and phone.
- Support email footer.

Failure behavior:

- Email failures are logged but do not fail the order after the order and items are saved.

## Admin New Order Alert

Trigger:

- Sent together with the order confirmation email.

Recipients:

- `ORDER_NOTIFICATION_EMAIL` if configured.
- Otherwise the store support email from `store_settings.contact_email` or `SUPPORT_EMAIL`.

Subject:

- `[New Order Alert] #{order.id}`

Template source:

- Same order template as the customer order confirmation in `src/lib/email.ts`.

Reply-to:

- Customer email when valid.
- Otherwise support email.

## Marketing Campaign Email

Trigger:

- Admin > Email Marketing at `/admin/email-marketing`.
- Server action: `sendMarketingCampaign()` in `src/app/actions/email.ts`.

Recipients:

- All customer emails: union of registered customer profile emails and past order contact emails.
- Registered customers: `profiles.email` where role is `customer`.
- Past order customers: `orders.contact_email`.
- Custom recipients: admin-entered email list.
- Test send: single admin-entered test recipient.

Subject:

- Admin-entered subject.

Template source:

- `buildMarketingEmailHtml()` in `src/lib/email.ts`.

Editable content:

- Subject.
- Preheader.
- Hero image URL.
- Heading.
- Body copy.
- CTA label.
- CTA URL.
- Accent color.
- Footer note.

Campaign logging:

- Sent/test campaign metadata is inserted into `email_marketing_campaigns`.
- Logged fields include segment, recipient count, sent count, failed count, status, and error log.

Safety:

- Marketing body content is escaped before being rendered into the email template.
- Emails are sent individually, not through a visible `cc` or `bcc` list.
- Recipient list is de-duplicated and capped at 500 per send.

## Supabase Auth Emails

Registration uses Supabase auth email confirmation in `src/app/register/page.tsx`.

Those emails are not sent by `src/lib/email.ts`; they are sent by Supabase Auth configuration for the Supabase project.
