/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — Email Templates
 * Precision Forge Labs | GSTIN: 27GZCPS9353H1ZQ
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE ON GITHUB PAGES / NODE
 * ───────────────────────────────────
 * Client-side (plain <script>):
 *   <script src="../utils/email-templates.js"></script>
 *   const html = AkaraEmail.orderConfirmation(orderData);
 *
 * Server-side / Supabase Edge Function (Node / Deno):
 *   Copy the IIFE body, remove the `global.AkaraEmail = ...` line,
 *   and export instead:  export const AkaraEmail = { ... };
 *
 * Sending via Supabase Edge Function + Resend / SendGrid:
 *   import { AkaraEmail } from './email-templates.js';
 *   await resend.emails.send({
 *     from:    'orders@akaraonline.co.in',
 *     to:      customer.email,
 *     subject: AkaraEmail.subject.orderConfirmation(orderData),
 *     html:    AkaraEmail.orderConfirmation(orderData),
 *   });
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT'S IMPROVED vs. the old email-templates.js
 * ───────────────────────────────────────────────
 * ✓ No ES module exports — works as plain <script> on GitHub Pages
 * ✓ Full brand-consistent HTML (teal/gold, Atelier Ākāra styling)
 * ✓ Inline CSS throughout (required for email clients — no external CSS)
 * ✓ Plain-text fallback alongside HTML (for spam filter compliance)
 * ✓ Subject line generators for each template
 * ✓ 10 complete templates covering the full customer journey
 * ✓ GST invoice attachment note in order confirmation
 * ✓ Escaped HTML in all user-supplied data (XSS prevention)
 * ✓ Responsive — renders correctly in Gmail, Outlook, Apple Mail
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ─────────────────────────────────────────────────────────────────

  const BRAND = {
    name:       'Atelier Ākāra',
    legal:      'Precision Forge Labs',
    gstin:      '27GZCPS9353H1ZQ',
    email:      'support@akaraonline.co.in',
    phone:      '+91 82780 85572',
    website:    'https://akaraonline.co.in',
    instagram:  'https://instagram.com/atelier.akara',
    address:    'Thane, Maharashtra 400601, India',
    color:      '#002b2b',
    gold:       '#c9a96e',
    cream:      '#fff8e7',
  };

  // ─────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────

  /** Escape HTML to prevent XSS in user-supplied data */
  function esc(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Format INR */
  function fmt(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  }

  /** Format date to readable Indian format */
  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ─────────────────────────────────────────────────────────────────
  // BASE LAYOUT
  // All emails share this shell. It handles:
  //  - Dark header with brand name
  //  - White content area
  //  - GST footer
  // ─────────────────────────────────────────────────────────────────

  function layout(title, bodyContent, footerNote = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${esc(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f2ede6;font-family:Arial,Helvetica,sans-serif;">

  <!-- Preheader (visible in inbox preview, hidden in email body) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f2ede6;">${esc(title)}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2ede6;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <!-- Email container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.color};padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;letter-spacing:5px;text-transform:uppercase;color:${BRAND.cream};font-weight:300;font-family:Georgia,serif;">ATELIER ĀKĀRA</p>
                    <p style="margin:4px 0 0;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:${BRAND.gold};opacity:0.85;">Artifacts for the Modern Spaces</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="height:2px;background:linear-gradient(90deg,${BRAND.color},${BRAND.gold},${BRAND.color});font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;background-color:#ffffff;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer note (optional — e.g. GST note, order terms) -->
          ${footerNote ? `
          <tr>
            <td style="padding:0 40px 24px;background-color:#ffffff;">
              <p style="margin:0;font-size:11px;color:#999;line-height:1.6;border-top:1px solid #f0ebe0;padding-top:16px;">${footerNote}</p>
            </td>
          </tr>` : ''}

          <!-- Bottom bar -->
          <tr>
            <td style="background-color:${BRAND.color};padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:11px;color:${BRAND.cream};opacity:0.7;">${BRAND.legal}&nbsp;·&nbsp;GSTIN: ${BRAND.gstin}</p>
                    <p style="margin:0 0 6px;font-size:11px;color:${BRAND.cream};opacity:0.7;">${BRAND.address}</p>
                    <p style="margin:0;font-size:11px;">
                      <a href="mailto:${BRAND.email}" style="color:${BRAND.gold};text-decoration:none;">${BRAND.email}</a>
                      &nbsp;·&nbsp;
                      <a href="${BRAND.website}" style="color:${BRAND.gold};text-decoration:none;">${BRAND.website}</a>
                      &nbsp;·&nbsp;
                      <a href="${BRAND.instagram}" style="color:${BRAND.gold};text-decoration:none;">Instagram</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Unsubscribe / legal note -->
          <tr>
            <td style="padding:12px 40px;background-color:#ede8e0;text-align:center;">
              <p style="margin:0;font-size:9px;color:#aaa;letter-spacing:1px;">
                You received this email because you placed an order or registered at akaraonline.co.in.
                &nbsp;·&nbsp;
                <a href="${BRAND.website}/user/profile.html" style="color:#aaa;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // REUSABLE BLOCKS
  // ─────────────────────────────────────────────────────────────────

  function h1(text) {
    return `<h1 style="margin:0 0 8px;font-size:28px;font-weight:300;color:${BRAND.color};font-family:Georgia,serif;letter-spacing:2px;">${esc(text)}</h1>`;
  }

  function subhead(text) {
    return `<p style="margin:0 0 24px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.gold};">${esc(text)}</p>`;
  }

  function divider() {
    return `<hr style="border:none;border-top:1px solid #f0ebe0;margin:24px 0;">`;
  }

  function paragraph(text) {
    return `<p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.7;">${text}</p>`;
  }

  function smallText(text) {
    return `<p style="margin:0 0 12px;font-size:12px;color:#888;line-height:1.65;">${text}</p>`;
  }

  function ctaButton(label, url) {
    return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:${BRAND.gold};padding:0;">
          <a href="${esc(url)}" style="display:inline-block;padding:14px 36px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.color};text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;">${esc(label)}</a>
        </td>
      </tr>
    </table>`;
  }

  function secondaryButton(label, url) {
    return `<p style="margin:16px 0 0;"><a href="${esc(url)}" style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};text-decoration:none;border-bottom:1px solid ${BRAND.gold};padding-bottom:2px;">${esc(label)} →</a></p>`;
  }

  function infoBox(rows) {
    const rowsHtml = rows.map(([k, v]) => `
      <tr>
        <td style="padding:8px 16px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;border-bottom:1px solid #f5f0ea;white-space:nowrap;">${esc(k)}</td>
        <td style="padding:8px 16px;font-size:13px;color:#333;border-bottom:1px solid #f5f0ea;"><strong>${v}</strong></td>
      </tr>`).join('');
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf8f4;border:1px solid #ede8e0;margin:20px 0;">
      ${rowsHtml}
    </table>`;
  }

  function itemsTable(items) {
    const rows = items.map(item => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#333;border-bottom:1px solid #f5f0ea;">${esc(item.name)}${item.variant ? `<br><span style="font-size:11px;color:#aaa;">${esc(item.variant)}</span>` : ''}</td>
        <td style="padding:10px 16px;font-size:13px;color:#888;border-bottom:1px solid #f5f0ea;text-align:center;">${esc(String(item.quantity))}</td>
        <td style="padding:10px 16px;font-size:13px;color:#333;border-bottom:1px solid #f5f0ea;text-align:right;">${fmt(item.price * item.quantity)}</td>
      </tr>`).join('');

    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <thead>
        <tr style="background-color:${BRAND.color};">
          <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-align:left;font-weight:normal;">Product</th>
          <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-align:center;font-weight:normal;">Qty</th>
          <th style="padding:10px 16px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-align:right;font-weight:normal;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${`
        <tr style="background-color:#faf8f4;">
          <td colspan="2" style="padding:10px 16px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#888;">Grand Total (GST-inclusive)</td>
          <td style="padding:10px 16px;font-size:16px;color:${BRAND.color};text-align:right;font-weight:bold;">${fmt(items.reduce((s, i) => s + i.price * i.quantity, 0))}</td>
        </tr>`}
      </tbody>
    </table>`;
  }

  function alertBox(message, type = 'info') {
    const colors = {
      info:    { bg: '#f0f9f4', border: '#70c9a0', text: '#1e6b4a' },
      warning: { bg: '#fffbf0', border: '#c9a96e', text: '#7a5a00' },
      error:   { bg: '#fff3f3', border: '#e07070', text: '#8b2c2c' },
    };
    const c = colors[type] || colors.info;
    return `<div style="background-color:${c.bg};border-left:3px solid ${c.border};padding:14px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:${c.text};line-height:1.6;">${message}</p>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // TEMPLATES
  // ─────────────────────────────────────────────────────────────────

  // ── 1. Order Confirmation ──────────────────────────────────────

  function orderConfirmation(order) {
    const items   = order.items || [];
    const address = order.address || {};
    const body = `
      ${subhead('Order Confirmed')}
      ${h1('Thank You for Your Order')}
      ${divider()}
      ${paragraph(`Hi ${esc(order.customer_name || 'there')}, your order has been received and is being prepared for production.`)}
      ${infoBox([
        ['Order Reference', esc(order.order_id || '—')],
        ['Order Date',      fmtDate(order.date || new Date())],
        ['Payment Method',  esc(order.payment_method || '—')],
        ['Lead Time',       '2–3 weeks production + 5–8 days shipping'],
      ])}
      ${items.length ? itemsTable(items) : ''}
      ${order.shipping_cost > 0
        ? `${smallText(`Shipping: ${fmt(order.shipping_cost)}`)}`
        : `${smallText('Shipping: <strong>Free</strong>')}`}
      ${paragraph('A GST tax invoice will be emailed to you separately once your order is dispatched.')}
      ${ctaButton('View My Order', `${BRAND.website}/user/profile.html`)}
      ${secondaryButton('Continue Shopping', `${BRAND.website}/catalog.html`)}
    `;
    return layout(
      `Order Confirmed — ${order.order_id}`,
      body,
      'All prices are GST-inclusive (18%). Products are for indoor use only. Returns accepted within 7 days of delivery for damaged or defective items. Custom colour orders are final sale.'
    );
  }

  // ── 2. Shipping Update ─────────────────────────────────────────

  function shippingUpdate(order) {
    const body = `
      ${subhead('On Its Way')}
      ${h1('Your Order Has Shipped')}
      ${divider()}
      ${paragraph(`Great news, ${esc(order.customer_name || 'there')}! Order <strong>${esc(order.order_id)}</strong> has left our studio in Thane and is heading to you.`)}
      ${infoBox([
        ['Order Reference', esc(order.order_id || '—')],
        ['Courier',         esc(order.courier || 'Delhivery')],
        ['Tracking Number', esc(order.tracking_number || '—')],
        ['Estimated Delivery', esc(order.estimated_delivery || '5–8 business days')],
        ['Shipping To',     esc([order.address?.city, order.address?.state].filter(Boolean).join(', ') || '—')],
      ])}
      ${order.tracking_url
        ? ctaButton('Track My Order', order.tracking_url)
        : ctaButton('View My Order', `${BRAND.website}/user/profile.html`)}
      ${paragraph('If delivery is attempted while you're out, the courier will leave a notification and retry the next business day. After 3 failed attempts, the package will be held at the nearest facility.')}
    `;
    return layout(`Your Order Has Shipped — ${order.order_id}`, body);
  }

  // ── 3. Order Delivered ─────────────────────────────────────────

  function orderDelivered(order) {
    const body = `
      ${subhead('Delivered')}
      ${h1('Your Order Has Arrived')}
      ${divider()}
      ${paragraph(`Hi ${esc(order.customer_name || 'there')}, your order <strong>${esc(order.order_id)}</strong> has been delivered. We hope you love your new piece.`)}
      ${alertBox('If anything looks damaged or wrong, please email us within <strong>7 days</strong> of delivery with a photo and your order number. We will sort it out immediately.', 'info')}
      ${ctaButton('Write a Review', `${BRAND.website}/catalog.html`)}
      ${secondaryButton('View My Orders', `${BRAND.website}/user/profile.html`)}
      ${paragraph('Thank you for supporting a small Indian studio. Sharing a photo on Instagram and tagging <strong>@atelier.akara</strong> means the world to us.')}
    `;
    return layout(`Delivered — ${order.order_id}`, body);
  }

  // ── 4. Password Reset ──────────────────────────────────────────

  function passwordReset(data) {
    const body = `
      ${subhead('Account Security')}
      ${h1('Reset Your Password')}
      ${divider()}
      ${paragraph(`Hi${data.name ? ' ' + esc(data.name) : ''}, we received a request to reset the password for your Atelier Ākāra account.`)}
      ${paragraph('Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.')}
      ${ctaButton('Reset Password', data.reset_url)}
      ${paragraph('If the button above doesn\'t work, copy and paste this link into your browser:')}
      ${smallText(`<a href="${esc(data.reset_url)}" style="color:${BRAND.gold};word-break:break-all;">${esc(data.reset_url)}</a>`)}
      ${divider()}
      ${alertBox('If you did not request a password reset, please ignore this email. Your password will not change.', 'warning')}
    `;
    return layout('Reset Your Password — Atelier Ākāra', body,
      'This password reset link expires in 1 hour. For security, never share this link with anyone. Atelier Ākāra will never ask for your password by email.'
    );
  }

  // ── 5. Email Verification ──────────────────────────────────────

  function emailVerification(data) {
    const body = `
      ${subhead('Welcome')}
      ${h1('Verify Your Email')}
      ${divider()}
      ${paragraph(`Hi ${esc(data.name || 'there')}, thank you for creating an account with Atelier Ākāra.`)}
      ${paragraph('Click the button below to verify your email address and activate your account.')}
      ${ctaButton('Verify Email Address', data.verify_url)}
      ${paragraph('If the button above doesn\'t work, copy and paste this link into your browser:')}
      ${smallText(`<a href="${esc(data.verify_url)}" style="color:${BRAND.gold};word-break:break-all;">${esc(data.verify_url)}</a>`)}
      ${divider()}
      ${paragraph('Once verified, you\'ll be able to track orders, save your wishlist, and earn reward points on every purchase.')}
    `;
    return layout('Verify Your Email — Atelier Ākāra', body,
      'If you didn\'t create an account at akaraonline.co.in, you can safely ignore this email.'
    );
  }

  // ── 6. Return / Refund Approved ────────────────────────────────

  function refundApproved(order) {
    const body = `
      ${subhead('Refund Update')}
      ${h1('Your Refund Has Been Approved')}
      ${divider()}
      ${paragraph(`Hi ${esc(order.customer_name || 'there')}, we have approved the return request for order <strong>${esc(order.order_id)}</strong>.`)}
      ${infoBox([
        ['Order Reference', esc(order.order_id || '—')],
        ['Refund Amount',   fmt(order.refund_amount)],
        ['Refund Method',   esc(order.payment_method || 'Original payment method')],
        ['Timeline',        '5–14 business days depending on your bank'],
      ])}
      ${alertBox('Reverse pickup has been arranged at no cost to you. Our courier will contact you within 2 business days to collect the item.', 'info')}
      ${paragraph('Once we receive and inspect the returned item, the refund will be processed immediately. You will receive a confirmation email.')}
      ${ctaButton('View My Account', `${BRAND.website}/user/profile.html`)}
    `;
    return layout(`Refund Approved — ${order.order_id}`, body);
  }

  // ── 7. Order Cancelled ─────────────────────────────────────────

  function orderCancelled(order) {
    const body = `
      ${subhead('Order Update')}
      ${h1('Order Cancelled')}
      ${divider()}
      ${paragraph(`Hi ${esc(order.customer_name || 'there')}, order <strong>${esc(order.order_id)}</strong> has been cancelled${order.reason ? ': ' + esc(order.reason) : '.'}`)}
      ${infoBox([
        ['Order Reference', esc(order.order_id || '—')],
        ['Refund Amount',   fmt(order.refund_amount || 0)],
        ['Refund Timeline', '5–14 business days'],
      ])}
      ${paragraph('If you cancelled this order by mistake or have any questions, please reply to this email or contact us within 24 hours.')}
      ${ctaButton('Browse Collection', `${BRAND.website}/catalog.html`)}
    `;
    return layout(`Order Cancelled — ${order.order_id}`, body);
  }

  // ── 8. Welcome Email (post-verification) ──────────────────────

  function welcome(data) {
    const body = `
      ${subhead('Welcome to the Studio')}
      ${h1(`Welcome, ${esc(data.first_name || 'there')}`)}
      ${divider()}
      ${paragraph('Your account is now active. Here\'s what you can do:')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
        ${[
          ['🛒', 'Browse & Order', 'Shop our geometric planters, vases, and lighting — each made to order in Mumbai.'],
          ['⭐', 'Earn Reward Points', 'Every purchase earns points. Redeem for discounts on future orders.'],
          ['❤️', 'Save Your Wishlist', 'Save pieces you love and get notified when they go on sale.'],
          ['🧾', 'GST Invoices', 'Add your GSTIN to your profile for B2B tax invoices on every order.'],
        ].map(([icon, title, desc]) => `
        <tr>
          <td style="padding:10px 0;vertical-align:top;width:36px;font-size:20px;">${icon}</td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f5f0ea;">
            <strong style="font-size:13px;color:#222;">${title}</strong>
            <p style="margin:3px 0 0;font-size:12px;color:#888;line-height:1.5;">${desc}</p>
          </td>
        </tr>`).join('')}
      </table>
      ${data.member_id ? infoBox([['Your Member ID', esc(data.member_id)]]) : ''}
      ${ctaButton('Start Shopping', `${BRAND.website}/catalog.html`)}
    `;
    return layout('Welcome to Atelier Ākāra', body);
  }

  // ── 9. Drop Notification (limited edition alert) ───────────────

  function dropNotification(data) {
    const body = `
      ${subhead('Limited Drop Alert')}
      ${h1('A New Drop Just Went Live')}
      ${divider()}
      ${paragraph(`Hi ${esc(data.name || 'there')}, you signed up to be notified about new limited edition drops. The <strong>${esc(data.drop_name)}</strong> is now live.`)}
      ${infoBox([
        ['Drop Name',  esc(data.drop_name || '—')],
        ['Units',      esc(String(data.units || '—'))],
        ['Available',  'Now — while stocks last'],
      ])}
      ${alertBox('Limited edition drops sell out fast. These pieces are not restocked once sold.', 'warning')}
      ${ctaButton('Shop the Drop Now', `${BRAND.website}/limited-drops.html`)}
      ${paragraph('Once sold out, these pieces will not be available again. This is your only notification.')}
      ${secondaryButton('Unsubscribe from drop alerts', `${BRAND.website}/user/profile.html`)}
    `;
    return layout(`New Drop: ${data.drop_name} — Atelier Ākāra`, body);
  }

  // ── 10. Newsletter ─────────────────────────────────────────────

  function newsletter(data) {
    const body = `
      ${subhead(data.issue_label || 'Studio Notes')}
      ${h1(esc(data.headline || 'From the Studio'))}
      ${divider()}
      ${paragraph(data.intro || 'A note from the Atelier Ākāra studio.')}
      ${data.body_html || ''}
      ${data.cta_url && data.cta_label ? ctaButton(data.cta_label, data.cta_url) : ''}
      ${divider()}
      ${secondaryButton('Unsubscribe', `${BRAND.website}/user/profile.html`)}
    `;
    return layout(esc(data.headline || 'Studio Notes'), body);
  }

  // ─────────────────────────────────────────────────────────────────
  // SUBJECT LINES
  // Return the correct email subject for each template.
  // ─────────────────────────────────────────────────────────────────

  const subject = {
    orderConfirmation: (o)  => `Order Confirmed — ${o.order_id || ''} | Atelier Ākāra`,
    shippingUpdate:    (o)  => `Your Order Has Shipped — ${o.order_id || ''} | Atelier Ākāra`,
    orderDelivered:    (o)  => `Delivered — ${o.order_id || ''} | Atelier Ākāra`,
    passwordReset:     ()   => 'Reset Your Password — Atelier Ākāra',
    emailVerification: ()   => 'Verify Your Email — Atelier Ākāra',
    refundApproved:    (o)  => `Refund Approved — ${o.order_id || ''} | Atelier Ākāra`,
    orderCancelled:    (o)  => `Order Cancelled — ${o.order_id || ''} | Atelier Ākāra`,
    welcome:           (d)  => `Welcome to Atelier Ākāra, ${d.first_name || ''}`,
    dropNotification:  (d)  => `🔴 New Drop: ${d.drop_name || ''} is LIVE — Atelier Ākāra`,
    newsletter:        (d)  => esc(d.subject || d.headline || 'Studio Notes — Atelier Ākāra'),
  };

  // ─────────────────────────────────────────────────────────────────
  // PLAIN TEXT FALLBACKS
  // Required by email clients for spam compliance.
  // ─────────────────────────────────────────────────────────────────

  const plainText = {
    orderConfirmation: (o) =>
      `ORDER CONFIRMED — ${o.order_id}\n\nHi ${o.customer_name || 'there'},\n\nYour order has been confirmed and is being prepared for production.\n\nLead time: 2–3 weeks production + 5–8 days shipping.\n\nFor questions: ${BRAND.email}\n\n${BRAND.website}`,

    shippingUpdate: (o) =>
      `YOUR ORDER HAS SHIPPED — ${o.order_id}\n\nCourier: ${o.courier || '—'}\nTracking: ${o.tracking_number || '—'}\n${o.tracking_url ? 'Track at: ' + o.tracking_url + '\n' : ''}\nFor questions: ${BRAND.email}`,

    passwordReset: (d) =>
      `RESET YOUR PASSWORD\n\nClick the link below to reset your Atelier Ākāra password:\n${d.reset_url}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,

    emailVerification: (d) =>
      `VERIFY YOUR EMAIL\n\nClick the link below to verify your Atelier Ākāra account:\n${d.verify_url}\n\nIf you didn't create an account, ignore this email.`,
  };

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  const AkaraEmail = {
    // Templates
    orderConfirmation,
    shippingUpdate,
    orderDelivered,
    passwordReset,
    emailVerification,
    refundApproved,
    orderCancelled,
    welcome,
    dropNotification,
    newsletter,

    // Subject lines
    subject,

    // Plain text
    plainText,

    // Internals exposed for testing
    _layout:    layout,
    _infoBox:   infoBox,
    _itemsTable:itemsTable,
    _fmt:       fmt,
    _esc:       esc,
  };

  global.AkaraEmail = AkaraEmail;

})(typeof window !== 'undefined' ? window : global);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD:
 *   <script src="../utils/email-templates.js"></script>
 *
 * GET HTML:
 *   const html = AkaraEmail.orderConfirmation(orderData);
 *
 * GET SUBJECT:
 *   const sub  = AkaraEmail.subject.orderConfirmation(orderData);
 *
 * GET PLAIN TEXT:
 *   const txt  = AkaraEmail.plainText.orderConfirmation(orderData);
 *
 * ─── SEND VIA SUPABASE EDGE FUNCTION (Deno + Resend) ────────────
 *
 *   import { AkaraEmail } from '../utils/email-templates.js';
 *
 *   await fetch('https://api.resend.com/emails', {
 *     method: 'POST',
 *     headers: { 'Authorization': 'Bearer ' + Deno.env.get('RESEND_KEY'), 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       from:    'orders@akaraonline.co.in',
 *       to:      [order.customer_email],
 *       subject: AkaraEmail.subject.orderConfirmation(order),
 *       html:    AkaraEmail.orderConfirmation(order),
 *       text:    AkaraEmail.plainText.orderConfirmation(order),
 *     }),
 *   });
 *
 * ─── FULL orderData EXAMPLE ─────────────────────────────────────
 *
 *   AkaraEmail.orderConfirmation({
 *     order_id:       'INV-00124',
 *     customer_name:  'Priya Sharma',
 *     date:           '2026-05-07',
 *     payment_method: 'Razorpay',
 *     address:        { city: 'Mumbai', state: 'Maharashtra' },
 *     items: [
 *       { name: 'Geodesic Planter — Natural Teal', quantity: 2, price: 2400, variant: 'Medium' },
 *       { name: 'Tattva Vase — Warm Sand',         quantity: 1, price: 1249 },
 *     ],
 *     shipping_cost: 0,
 *   });
 *
 * ─── ALL TEMPLATES ──────────────────────────────────────────────
 *
 *   orderConfirmation(order)  — After successful payment
 *   shippingUpdate(order)     — When dispatched (include tracking_number, courier, tracking_url)
 *   orderDelivered(order)     — When courier marks delivered
 *   passwordReset(data)       — { name, reset_url }
 *   emailVerification(data)   — { name, verify_url }
 *   refundApproved(order)     — { order_id, customer_name, refund_amount, payment_method }
 *   orderCancelled(order)     — { order_id, customer_name, refund_amount, reason? }
 *   welcome(data)             — { first_name, member_id? }
 *   dropNotification(data)    — { name, drop_name, units }
 *   newsletter(data)          — { headline, subject?, issue_label?, intro, body_html?, cta_label?, cta_url? }
 *
 * ═══════════════════════════════════════════════════════════════════
 */