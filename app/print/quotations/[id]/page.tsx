import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PrintButton from "./print-button";

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } }, createdBy: { select: { name: true } } },
  });
  if (!q) redirect("/quotations");

  const discount = q.subtotal * (q.discountPct / 100);
  const afterDiscount = q.subtotal - discount;
  const tax = afterDiscount * (q.taxPct / 100);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{q.number} — Suvora CRM</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
          .page { max-width: 800px; margin: 0 auto; background: white; min-height: 100vh; }
          .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 40px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
          .back { color: #64748b; font-size: 13px; text-decoration: none; }
          .card { padding: 48px 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 2px solid #e2e8f0; }
          .brand { font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #4f46e5, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .brand-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
          .qt-number { font-size: 22px; font-weight: 700; color: #1e293b; text-align: right; }
          .qt-status { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 6px; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; text-transform: capitalize; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
          .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; }
          .company { font-size: 16px; font-weight: 700; color: #1e293b; }
          .detail { font-size: 13px; color: #64748b; margin-top: 3px; }
          .detail-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
          .detail-label { color: #64748b; }
          .detail-value { font-weight: 600; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th { background: #f8fafc; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          th:not(:first-child) { text-align: right; }
          th:first-child { text-align: left; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          td:not(:first-child) { text-align: right; }
          td:first-child { color: #1e293b; }
          td.amount { font-weight: 600; color: #1e293b; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
          .totals-box { width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .total-row.grand { border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 12px; margin-top: 4px; }
          .total-row.grand .tl { font-size: 15px; font-weight: 700; color: #1e293b; }
          .total-row.grand .tv { font-size: 18px; font-weight: 800; color: #4f46e5; }
          .tl { color: #64748b; }
          .tv { font-weight: 600; color: #1e293b; }
          .discount-val { color: #ef4444; }
          .tax-val { color: #f59e0b; }
          .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
          .notes-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; }
          .notes-text { font-size: 12px; color: #64748b; line-height: 1.6; }
          .footer { text-align: center; padding: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
          @media print { .toolbar { display: none !important; } body { background: white; } }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="toolbar no-print">
            <Link href="/quotations" className="back">← Back to Quotations</Link>
            <PrintButton />
          </div>

          <div className="card">
            {/* Header */}
            <div className="header">
              <div>
                <div className="brand">Suvora</div>
                <div className="brand-sub">CRM Platform · crm.suvora.tech</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="qt-number">{q.number}</div>
                <span className="qt-status">{q.status}</span>
              </div>
            </div>

            {/* Bill to + Details */}
            <div className="two-col">
              <div>
                <div className="section-label">Bill To</div>
                <div className="company">{q.clientCompany || q.clientName}</div>
                {q.clientCompany && <div className="detail">{q.clientName}</div>}
                {q.clientEmail && <div className="detail">{q.clientEmail}</div>}
              </div>
              <div>
                <div className="section-label">Details</div>
                <div className="detail-row"><span className="detail-label">Quotation No.</span><span className="detail-value">{q.number}</span></div>
                <div className="detail-row"><span className="detail-label">Issue Date</span><span className="detail-value">{new Date(q.issueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                {q.validUntil && <div className="detail-row"><span className="detail-label">Valid Until</span><span className="detail-value">{new Date(q.validUntil).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span></div>}
                {q.createdBy && <div className="detail-row"><span className="detail-label">Prepared By</span><span className="detail-value">{q.createdBy.name}</span></div>}
              </div>
            </div>

            {/* Items */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice.toLocaleString()}</td>
                    <td className="amount">${item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <div className="totals-box">
                <div className="total-row"><span className="tl">Subtotal</span><span className="tv">${q.subtotal.toLocaleString()}</span></div>
                {q.discountPct > 0 && <div className="total-row"><span className="tl">Discount ({q.discountPct}%)</span><span className="tv discount-val">-${discount.toFixed(2)}</span></div>}
                {q.taxPct > 0 && <div className="total-row"><span className="tl">Tax / GST ({q.taxPct}%)</span><span className="tv tax-val">+${tax.toFixed(2)}</span></div>}
                <div className="total-row grand"><span className="tl">Total</span><span className="tv">${q.total.toLocaleString()}</span></div>
              </div>
            </div>

            {/* Notes / Terms */}
            {(q.notes || q.terms) && (
              <div className="bottom">
                {q.notes && <div><div className="notes-title">Notes</div><div className="notes-text">{q.notes}</div></div>}
                {q.terms && <div><div className="notes-title">Terms & Conditions</div><div className="notes-text">{q.terms}</div></div>}
              </div>
            )}
          </div>

          <div className="footer">Generated by Suvora CRM · {new Date().getFullYear()}</div>
        </div>
      </body>
    </html>
  );
}
