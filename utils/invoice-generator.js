/**
 * ═══════════════════════════════════════════════════════════════════
 * ATELIER ĀKĀRA — GST Invoice Generator
 * Precision Forge Labs | GSTIN: 27GZCPS9353H1ZQ
 * ═══════════════════════════════════════════════════════════════════
 *
 * HOW TO USE ON GITHUB PAGES
 * ───────────────────────────
 * No build step required. Load as a plain <script>:
 *   <script src="../utils/invoice-generator.js"></script>
 *
 * Then use the global:
 *   const invoice = AkaraInvoice.generate(orderData);
 *   AkaraInvoice.print(orderData);
 *   AkaraInvoice.downloadHTML(orderData);
 *
 * ───────────────────────────────────────────────────────────────────
 * WHAT'S IMPROVED vs. the old invoice-generator.js
 * ──────────────────────────────────────────────────
 * ✓ No ES module exports — plain <script> compatible
 * ✓ Full GST-compliant invoice HTML generation (printable / downloadable)
 * ✓ Correct CGST/SGST vs IGST routing (Maharashtra intra vs inter-state)
 * ✓ GST-inclusive price extraction (your prices already include GST)
 * ✓ Sequential invoice numbering stored in localStorage (demo) or Supabase
 * ✓ Multi-line item support with HSN code
 * ✓ Reverse charge notice (as required on GST invoices)
 * ✓ Credit note generation for refunds
 * ✓ Print-optimised CSS — clean black-on-white output
 * ✓ Download as HTML file (no server / PDF library needed)
 * ═══════════════════════════════════════════════════════════════════
 */

;(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // COMPANY CONSTANTS
  // ─────────────────────────────────────────────────────────────────
  const COMPANY = {
    name:         'Precision Forge Labs',
    brand:        'Atelier Ākāra',
    gstin:        '27GZCPS9353H1ZQ',
    state:        'Maharashtra',
    state_code:   '27',
    address:      'Thane, Maharashtra 400601, India',
    email:        'support@akaraonline.co.in',
    phone:        '+91 82780 85572',
    website:      'akaraonline.co.in',
    gst_rate:     18,         // %
    hsn_code:     '39269099', // Plastics — other articles (PLA 3D-printed goods)
    invoice_prefix: 'PFL',
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. GST CALCULATION
  // All Ākāra prices are GST-inclusive (18%).
  // This extracts the base and tax components from the gross total.
  // ─────────────────────────────────────────────────────────────────

  /**
   * Calculate GST breakdown from a GST-inclusive gross amount.
   *
   * @param {number} grossTotal   — Price the customer paid (GST-inclusive)
   * @param {string} customerState — Customer's delivery state
   * @returns GSTBreakdown object
   */
  function calculateGST(grossTotal, customerState) {
    const rate       = COMPANY.gst_rate;
    const base       = +(grossTotal / (1 + rate / 100)).toFixed(2);
    const totalTax   = +(grossTotal - base).toFixed(2);
    const isIntraState = normaliseState(customerState) === 'maharashtra';

    return {
      base_amount:  base,
      total_tax:    totalTax,
      cgst_rate:    isIntraState ? rate / 2 : 0,
      cgst_amount:  isIntraState ? +(totalTax / 2).toFixed(2) : 0,
      sgst_rate:    isIntraState ? rate / 2 : 0,
      sgst_amount:  isIntraState ? +(totalTax / 2).toFixed(2) : 0,
      igst_rate:    isIntraState ? 0 : rate,
      igst_amount:  isIntraState ? 0 : totalTax,
      gross_total:  grossTotal,
      is_intra:     isIntraState,
    };
  }

  function normaliseState(state) {
    return (state || '').toLowerCase().trim()
      .replace(/\s+/g, '')
      .replace('mh', 'maharashtra');
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. INVOICE NUMBER GENERATOR
  // Format: PFL/2026/00001
  // Stored in localStorage for demo. Replace with Supabase sequence
  // for production.
  // ─────────────────────────────────────────────────────────────────

  function getNextInvoiceNumber() {
    const year = new Date().getFullYear();
    const key  = `akara_invoice_seq_${year}`;
    const current = parseInt(localStorage.getItem(key) || '0');
    const next    = current + 1;
    localStorage.setItem(key, String(next));
    return `${COMPANY.invoice_prefix}/${year}/${String(next).padStart(5, '0')}`;
  }

  function getCreditNoteNumber() {
    const year = new Date().getFullYear();
    const key  = `akara_credit_seq_${year}`;
    const current = parseInt(localStorage.getItem(key) || '0');
    const next    = current + 1;
    localStorage.setItem(key, String(next));
    return `CN/${year}/${String(next).padStart(5, '0')}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. DATA BUILDER
  // Assembles the full invoice data object from raw orderData.
  // ─────────────────────────────────────────────────────────────────

  /**
   * Build a complete invoice data object.
   *
   * @param {object} orderData — See InvoiceOrderData schema below
   * @returns InvoiceData object
   *
   * InvoiceOrderData schema:
   * {
   *   order_id:       'INV-00124',          // your order reference
   *   invoice_number: 'PFL/2026/00001',     // optional — auto-generated if omitted
   *   date:           '2026-05-07',         // optional — defaults to today
   *   customer: {
   *     name:         'Priya Sharma',
   *     email:        'priya@example.com',
   *     phone:        '+91 98765 43210',    // optional
   *     gstin:        '27XXXXX1234X1Z5',   // optional — for B2B
   *     company:      'Interiors Co.',     // optional — for B2B
   *     address: {
   *       line1:   'Flat 4B, Sea View Apts',
   *       line2:   '',                     // optional
   *       city:    'Mumbai',
   *       state:   'Maharashtra',
   *       pincode: '400050',
   *     }
   *   },
   *   items: [
   *     {
   *       name:      'Geodesic Planter — Natural Teal',
   *       hsn_code:  '39269099',   // optional — uses COMPANY default
   *       quantity:  2,
   *       unit_price: 2400,        // GST-inclusive unit price
   *     }
   *   ],
   *   shipping_cost: 199,          // optional — 0 = free
   *   discount:      0,            // optional — amount already deducted from item prices
   *   payment_method: 'Razorpay',  // optional
   *   payment_id:    'pay_xyz123', // optional
   *   type:          'invoice',    // 'invoice' | 'credit_note'
   *   credit_note_for: 'PFL/2026/00001',  // required if type = 'credit_note'
   *   reason:        'Product damaged in transit', // for credit notes
   * }
   */
  function buildInvoiceData(orderData) {
    const isCreditNote = orderData.type === 'credit_note';
    const date         = orderData.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const invoiceNum   = orderData.invoice_number || (isCreditNote ? getCreditNoteNumber() : getNextInvoiceNumber());

    // Process line items
    const items = (orderData.items || []).map(item => {
      const lineGross = +(item.unit_price * item.quantity).toFixed(2);
      const gst       = calculateGST(lineGross, orderData.customer?.address?.state || '');
      return {
        name:        item.name,
        hsn_code:    item.hsn_code || COMPANY.hsn_code,
        quantity:    item.quantity,
        unit_price:  item.unit_price,   // GST-inclusive
        line_gross:  lineGross,
        base_amount: gst.base_amount,
        ...gst,
      };
    });

    // Subtotal (GST-inclusive sum of items)
    const itemsGross = +items.reduce((s, i) => s + i.line_gross, 0).toFixed(2);
    const shipping   = +(orderData.shipping_cost || 0);
    const discount   = +(orderData.discount || 0);
    const grandTotal = +(itemsGross + shipping - discount).toFixed(2);

    // Overall GST (on items only — shipping is usually GST-free domestic)
    const overallGST = calculateGST(itemsGross, orderData.customer?.address?.state || '');

    return {
      type:              isCreditNote ? 'CREDIT NOTE' : 'TAX INVOICE',
      invoice_number:    invoiceNum,
      order_id:          orderData.order_id || '',
      date,
      credit_note_for:   orderData.credit_note_for || null,
      reason:            orderData.reason || null,

      company: { ...COMPANY },

      customer: {
        name:    orderData.customer?.name    || 'Customer',
        email:   orderData.customer?.email   || '',
        phone:   orderData.customer?.phone   || '',
        gstin:   orderData.customer?.gstin   || '',
        company: orderData.customer?.company || '',
        address: orderData.customer?.address || {},
      },

      items,

      subtotal:          itemsGross,
      shipping:          shipping,
      discount:          discount,
      grand_total:       grandTotal,

      gst: overallGST,

      payment_method:    orderData.payment_method || '',
      payment_id:        orderData.payment_id     || '',

      is_b2b: !!(orderData.customer?.gstin),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. HTML INVOICE TEMPLATE
  // Print-optimised, brand-consistent, fully self-contained.
  // ─────────────────────────────────────────────────────────────────

  function renderInvoiceHTML(data) {
    const c   = data.customer;
    const gst = data.gst;

    const addrParts = [c.address.line1, c.address.line2, c.address.city, c.address.state, c.address.pincode].filter(Boolean);

    const isCreditNote = data.type === 'CREDIT NOTE';
    const headerColor  = isCreditNote ? '#8b2c2c' : '#002b2b';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.type} — ${data.invoice_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px; color: #1a1a1a;
      background: #fff; padding: 0;
    }

    /* ── Wrapper ── */
    .invoice-wrapper {
      max-width: 840px; margin: 0 auto;
      padding: 40px 48px;
      border: 1px solid #e5e5e5;
    }

    /* ── Header band ── */
    .inv-header {
      background: ${headerColor};
      color: #fff8e7;
      padding: 28px 32px;
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 32px;
    }
    .inv-brand-name { font-size: 22px; letter-spacing: 4px; text-transform: uppercase; font-weight: 300; margin-bottom: 2px; }
    .inv-brand-tag  { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.65; margin-bottom: 12px; }
    .inv-brand-sub  { font-size: 10px; opacity: 0.7; line-height: 1.6; }
    .inv-type-block { text-align: right; }
    .inv-type       { font-size: ${isCreditNote ? '18px' : '20px'}; letter-spacing: 2px; text-transform: uppercase; font-weight: 300; margin-bottom: 6px; color: ${isCreditNote ? '#ffa0a0' : '#c9a96e'}; }
    .inv-number     { font-size: 14px; letter-spacing: 1px; color: #c9a96e; }
    .inv-date       { font-size: 11px; opacity: 0.65; margin-top: 4px; }

    /* ── Two-column party block ── */
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .party-section {}
    .party-label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .party-name  { font-size: 13px; font-weight: bold; margin-bottom: 3px; }
    .party-line  { font-size: 11px; color: #555; line-height: 1.65; }
    .party-gstin { font-size: 10px; color: #333; margin-top: 4px; font-family: 'Courier New', monospace; }

    /* ── Order reference ── */
    .ref-band {
      background: #f9f6f0; border: 1px solid #e8dfc8;
      padding: 10px 16px; margin-bottom: 24px;
      display: flex; gap: 40px; flex-wrap: wrap;
    }
    .ref-item { display: flex; flex-direction: column; gap: 2px; }
    .ref-key  { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #999; }
    .ref-val  { font-size: 11px; font-weight: bold; color: #333; }

    /* ── Credit note reference ── */
    .cn-ref { background: #fff3f3; border: 1px solid #f5c0c0; padding: 10px 16px; margin-bottom: 20px; font-size: 11px; color: #8b2c2c; }
    .cn-ref strong { display: block; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 3px; }

    /* ── Items table ── */
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .items-table th {
      background: ${headerColor}; color: #fff8e7;
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      padding: 9px 12px; text-align: left; font-weight: normal;
    }
    .items-table th:last-child,
    .items-table td:last-child { text-align: right; }
    .items-table th:nth-child(3),
    .items-table td:nth-child(3),
    .items-table th:nth-child(4),
    .items-table td:nth-child(4) { text-align: center; }
    .items-table td { padding: 10px 12px; font-size: 11px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .items-table tr:last-child td { border-bottom: 1px solid #e0d8c0; }
    .item-name  { font-weight: bold; color: #1a1a1a; }
    .item-hsn   { font-size: 9px; color: #999; margin-top: 2px; font-family: 'Courier New', monospace; }

    /* ── Totals ── */
    .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 320px; border-collapse: collapse; }
    .totals-table td { padding: 6px 12px; font-size: 11px; }
    .totals-table .label { color: #666; }
    .totals-table .value { text-align: right; font-family: 'Courier New', monospace; color: #333; }
    .totals-table .subtotal-row td { border-top: 1px solid #eee; padding-top: 10px; }
    .totals-table .grand-row td { border-top: 2px solid ${headerColor}; padding-top: 10px; font-weight: bold; font-size: 13px; color: ${headerColor}; }
    .totals-table .gst-row td    { color: #888; font-size: 10px; }
    .totals-table .discount-row td { color: #2e7d32; }

    /* ── GST summary ── */
    .gst-summary {
      border: 1px solid #e8dfc8; margin-bottom: 24px;
    }
    .gst-summary table { width: 100%; border-collapse: collapse; }
    .gst-summary th { background: #f9f6f0; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; padding: 8px 12px; text-align: left; color: #888; font-weight: normal; }
    .gst-summary th:not(:first-child),
    .gst-summary td:not(:first-child) { text-align: right; }
    .gst-summary td { padding: 8px 12px; font-size: 11px; border-top: 1px solid #f0ebe0; color: #555; }
    .gst-summary .total-row td { font-weight: bold; color: #333; border-top: 1px solid #e0d8c0; background: #fefcf7; }

    /* ── Notices ── */
    .notices { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .notice { font-size: 9px; color: #aaa; line-height: 1.6; }
    .notice strong { display: block; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; color: #999; }

    /* ── Footer ── */
    .inv-footer {
      border-top: 1px solid #e8dfc8; padding-top: 14px;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 9px; color: #bbb; letter-spacing: 1px;
    }
    .inv-footer a { color: #c9a96e; }

    /* ── Amount in words ── */
    .amount-words {
      background: #f9f6f0; border: 1px solid #e8dfc8;
      padding: 10px 16px; margin-bottom: 20px;
      font-size: 10px; color: #555; line-height: 1.6;
    }
    .amount-words strong { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #888; display: block; margin-bottom: 3px; }

    /* ── Print overrides ── */
    @media print {
      body { padding: 0; }
      .invoice-wrapper { border: none; max-width: 100%; padding: 20px 28px; }
      .no-print { display: none !important; }
    }

    /* ── Action bar (screen only) ── */
    .action-bar {
      max-width: 840px; margin: 0 auto 16px;
      display: flex; gap: 10px; flex-wrap: wrap;
      padding: 0 48px;
      font-family: Arial, sans-serif;
    }
    .action-bar button {
      padding: 9px 20px;
      font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
      cursor: pointer; border: 1px solid;
    }
    .btn-print    { background: #002b2b; color: #fff8e7; border-color: #002b2b; }
    .btn-download { background: #fff; color: #c9a96e; border-color: #c9a96e; }
    @media print { .action-bar { display: none; } }
  </style>
</head>
<body>

  <div class="action-bar no-print">
    <button class="btn-print"    onclick="window.print()">⎙ Print Invoice</button>
    <button class="btn-download" onclick="window.close()">← Back</button>
  </div>

  <div class="invoice-wrapper">

    <!-- Header -->
    <div class="inv-header">
      <div>
        <div class="inv-brand-name">ATELIER ĀKĀRA</div>
        <div class="inv-brand-tag">Artifacts for the Modern Spaces</div>
        <div class="inv-brand-sub">
          ${COMPANY.name}<br>
          GSTIN: ${COMPANY.gstin}<br>
          ${COMPANY.address}<br>
          ${COMPANY.email}
        </div>
      </div>
      <div class="inv-type-block">
        <div class="inv-type">${data.type}</div>
        <div class="inv-number">${data.invoice_number}</div>
        <div class="inv-date">${data.date}</div>
      </div>
    </div>

    ${isCreditNote && data.credit_note_for ? `
    <div class="cn-ref">
      <strong>Credit Note Against</strong>
      Invoice No: ${data.credit_note_for}${data.reason ? `&nbsp;&nbsp;·&nbsp;&nbsp;Reason: ${data.reason}` : ''}
    </div>` : ''}

    <!-- Party Grid -->
    <div class="party-grid">
      <div class="party-section">
        <div class="party-label">Billed By</div>
        <div class="party-name">${COMPANY.name}</div>
        <div class="party-line">${COMPANY.brand}</div>
        <div class="party-line">${COMPANY.address}</div>
        <div class="party-line">${COMPANY.email} · ${COMPANY.phone}</div>
        <div class="party-gstin">GSTIN: ${COMPANY.gstin}</div>
        <div class="party-gstin">State: ${COMPANY.state} (Code: ${COMPANY.state_code})</div>
      </div>
      <div class="party-section">
        <div class="party-label">Billed To</div>
        <div class="party-name">${c.company || c.name}</div>
        ${c.company ? `<div class="party-line">${c.name}</div>` : ''}
        <div class="party-line">${addrParts.join(', ')}</div>
        ${c.email ? `<div class="party-line">${c.email}</div>` : ''}
        ${c.phone ? `<div class="party-line">${c.phone}</div>` : ''}
        ${c.gstin ? `<div class="party-gstin">GSTIN: ${c.gstin}</div>` : ''}
        <div class="party-line" style="margin-top:4px;font-size:10px;color:#888;">State: ${c.address.state || '—'}</div>
      </div>
    </div>

    <!-- Reference band -->
    <div class="ref-band">
      <div class="ref-item"><span class="ref-key">Invoice No.</span><span class="ref-val">${data.invoice_number}</span></div>
      <div class="ref-item"><span class="ref-key">Order Ref.</span><span class="ref-val">${data.order_id || '—'}</span></div>
      <div class="ref-item"><span class="ref-key">Date</span><span class="ref-val">${data.date}</span></div>
      <div class="ref-item"><span class="ref-key">Supply Type</span><span class="ref-val">${gst.is_intra ? 'Intra-State (MH)' : 'Inter-State'}</span></div>
      ${data.payment_method ? `<div class="ref-item"><span class="ref-key">Payment</span><span class="ref-val">${data.payment_method}</span></div>` : ''}
      <div class="ref-item"><span class="ref-key">Customer Type</span><span class="ref-val">${data.is_b2b ? 'B2B (Registered)' : 'B2C (Consumer)'}</span></div>
    </div>

    <!-- Items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:40%">Description of Goods</th>
          <th>HSN</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Taxable Value</th>
          ${gst.is_intra
            ? '<th>CGST 9%</th><th>SGST 9%</th>'
            : '<th>IGST 18%</th>'}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
        <tr>
          <td><div class="item-name">${item.name}</div><div class="item-hsn">HSN: ${item.hsn_code}</div></td>
          <td style="font-family:'Courier New',monospace;font-size:10px;">${item.hsn_code}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${fmt(item.unit_price)}</td>
          <td style="text-align:right;">₹${fmt(item.base_amount)}</td>
          ${gst.is_intra
            ? `<td style="text-align:right;">₹${fmt(item.cgst_amount)}</td><td style="text-align:right;">₹${fmt(item.sgst_amount)}</td>`
            : `<td style="text-align:right;">₹${fmt(item.igst_amount)}</td>`}
          <td style="text-align:right;">₹${fmt(item.line_gross)}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-wrap">
      <table class="totals-table">
        <tr class="subtotal-row">
          <td class="label">Items Subtotal</td>
          <td class="value">₹${fmt(data.subtotal)}</td>
        </tr>
        ${data.shipping > 0 ? `
        <tr>
          <td class="label">Shipping</td>
          <td class="value">₹${fmt(data.shipping)}</td>
        </tr>` : `
        <tr>
          <td class="label">Shipping</td>
          <td class="value" style="color:#2e7d32;">Free</td>
        </tr>`}
        ${data.discount > 0 ? `
        <tr class="discount-row">
          <td class="label">Discount</td>
          <td class="value">− ₹${fmt(data.discount)}</td>
        </tr>` : ''}
        <tr class="gst-row">
          <td class="label">Taxable Base</td>
          <td class="value">₹${fmt(gst.base_amount)}</td>
        </tr>
        ${gst.is_intra ? `
        <tr class="gst-row">
          <td class="label">CGST @ ${gst.cgst_rate}%</td>
          <td class="value">₹${fmt(gst.cgst_amount)}</td>
        </tr>
        <tr class="gst-row">
          <td class="label">SGST @ ${gst.sgst_rate}%</td>
          <td class="value">₹${fmt(gst.sgst_amount)}</td>
        </tr>` : `
        <tr class="gst-row">
          <td class="label">IGST @ ${gst.igst_rate}%</td>
          <td class="value">₹${fmt(gst.igst_amount)}</td>
        </tr>`}
        <tr class="grand-row">
          <td class="label">GRAND TOTAL</td>
          <td class="value">₹${fmt(data.grand_total)}</td>
        </tr>
      </table>
    </div>

    <!-- Amount in words -->
    <div class="amount-words">
      <strong>Amount in Words</strong>
      ${numberToWords(Math.round(data.grand_total))} Rupees Only
    </div>

    <!-- GST Summary table -->
    <div class="gst-summary">
      <table>
        <thead>
          <tr>
            <th>Tax Type</th>
            <th>Taxable Amount</th>
            <th>Rate</th>
            <th>Tax Amount</th>
          </tr>
        </thead>
        <tbody>
          ${gst.is_intra ? `
          <tr><td>CGST</td><td>₹${fmt(gst.base_amount)}</td><td>${gst.cgst_rate}%</td><td>₹${fmt(gst.cgst_amount)}</td></tr>
          <tr><td>SGST</td><td>₹${fmt(gst.base_amount)}</td><td>${gst.sgst_rate}%</td><td>₹${fmt(gst.sgst_amount)}</td></tr>
          ` : `
          <tr><td>IGST</td><td>₹${fmt(gst.base_amount)}</td><td>${gst.igst_rate}%</td><td>₹${fmt(gst.igst_amount)}</td></tr>
          `}
          <tr class="total-row"><td>Total GST</td><td></td><td></td><td>₹${fmt(gst.total_tax)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Notices -->
    <div class="notices">
      <div class="notice">
        <strong>Reverse Charge</strong>
        Tax is not payable on reverse charge basis. This invoice is issued for forward charge supply of goods.
      </div>
      <div class="notice">
        <strong>Terms & Conditions</strong>
        Products are for indoor use only. Returns accepted within 7 days of delivery (defective/damaged only). Custom colour orders are final sale. Prices are GST-inclusive.
      </div>
    </div>

    <!-- Footer -->
    <div class="inv-footer">
      <span>${COMPANY.name} · GSTIN: ${COMPANY.gstin}</span>
      <span>This is a computer-generated invoice. No signature required.</span>
      <span>${COMPANY.website}</span>
    </div>

  </div>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. NUMBER FORMATTING HELPERS
  // ─────────────────────────────────────────────────────────────────

  function fmt(amount) {
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function numberToWords(num) {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n) {
      if (n < 20)   return ones[n];
      if (n < 100)  return tens[Math.floor(n/10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000)   return convert(Math.floor(n/1000))    + ' Thousand' + (n % 1000 ? ' '    + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n/100000))  + ' Lakh'     + (n % 100000 ? ' '  + convert(n % 100000) : '');
      return convert(Math.floor(n/10000000)) + ' Crore'  + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }

    return convert(num);
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  const AkaraInvoice = {

    /**
     * Generate invoice data object without rendering.
     * Useful for saving to Supabase or logging.
     */
    generate(orderData) {
      return buildInvoiceData(orderData);
    },

    /**
     * Get the full GST breakdown for a given gross amount and state.
     */
    calculateGST(grossTotal, customerState) {
      return calculateGST(grossTotal, customerState);
    },

    /**
     * Open a print-ready invoice in a new browser tab.
     */
    print(orderData) {
      const data = buildInvoiceData(orderData);
      const html = renderInvoiceHTML(data);
      const win  = window.open('', '_blank');
      if (!win) { console.error('AkaraInvoice: popup blocked — use downloadHTML instead'); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      // Auto-print after fonts load
      setTimeout(() => win.print(), 800);
    },

    /**
     * Download the invoice as a standalone HTML file.
     * Works without popups — creates a download link.
     */
    downloadHTML(orderData) {
      const data     = buildInvoiceData(orderData);
      const html     = renderInvoiceHTML(data);
      const blob     = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url      = URL.createObjectURL(blob);
      const filename = `Invoice_${data.invoice_number.replace(/\//g, '-')}.html`;
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * Get just the HTML string (e.g. to store or send via email API).
     */
    getHTML(orderData) {
      const data = buildInvoiceData(orderData);
      return renderInvoiceHTML(data);
    },

    /**
     * Generate and save invoice record to Supabase `invoices` table.
     * Returns { ok, invoiceNumber, error? }
     */
    async saveToSupabase(supabase, orderData) {
      if (!supabase) return { ok: false, error: 'Supabase not configured' };
      try {
        const data = buildInvoiceData(orderData);
        const { error } = await supabase.from('invoices').insert([{
          invoice_number: data.invoice_number,
          order_id:       data.order_id,
          type:           data.type,
          customer_name:  data.customer.name,
          customer_email: data.customer.email,
          customer_gstin: data.customer.gstin || null,
          grand_total:    data.grand_total,
          gst_amount:     data.gst.total_tax,
          base_amount:    data.gst.base_amount,
          is_intra_state: data.gst.is_intra,
          invoice_date:   new Date().toISOString(),
          invoice_html:   renderInvoiceHTML(data),
        }]);
        if (error) throw error;
        return { ok: true, invoiceNumber: data.invoice_number };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    /** Expose number-to-words for other uses */
    numberToWords,

    /** Company constants (read-only reference) */
    COMPANY,
  };

  global.AkaraInvoice = AkaraInvoice;

})(window);

/*
 * ═══════════════════════════════════════════════════════════════════
 * QUICK REFERENCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * LOAD:
 *   <script src="../utils/invoice-generator.js"></script>
 *
 * PRINT (opens new tab + auto-print dialog):
 *   AkaraInvoice.print(orderData);
 *
 * DOWNLOAD AS HTML FILE:
 *   AkaraInvoice.downloadHTML(orderData);
 *
 * GET DATA OBJECT (for Supabase / logging):
 *   const invoice = AkaraInvoice.generate(orderData);
 *   console.log(invoice.invoice_number, invoice.grand_total);
 *
 * SAVE TO SUPABASE:
 *   const result = await AkaraInvoice.saveToSupabase(supabase, orderData);
 *   if (result.ok) console.log(result.invoiceNumber);
 *
 * GST ONLY:
 *   const gst = AkaraInvoice.calculateGST(2400, 'Maharashtra');
 *   // → { base_amount: 2033.90, cgst_amount: 183.05, sgst_amount: 183.05, ... }
 *
 * CREDIT NOTE:
 *   AkaraInvoice.print({ ...orderData, type: 'credit_note', credit_note_for: 'PFL/2026/00001', reason: 'Damaged in transit' });
 *
 * ─── FULL orderData EXAMPLE ─────────────────────────────────────
 *   AkaraInvoice.print({
 *     order_id:       'INV-00124',
 *     payment_method: 'Razorpay',
 *     payment_id:     'pay_abc123',
 *     customer: {
 *       name:    'Priya Sharma',
 *       email:   'priya@example.com',
 *       phone:   '+91 98765 43210',
 *       address: { line1: 'Flat 4B, Sea View Apts', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' }
 *     },
 *     items: [
 *       { name: 'Geodesic Planter — Natural Teal', quantity: 2, unit_price: 2400 },
 *       { name: 'Tattva Vase — Warm Sand',         quantity: 1, unit_price: 1249 },
 *     ],
 *     shipping_cost: 0,
 *   });
 * ═══════════════════════════════════════════════════════════════════
 */