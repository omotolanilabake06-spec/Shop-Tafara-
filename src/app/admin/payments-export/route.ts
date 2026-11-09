import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";
import { listPayments } from "@/lib/db/payments";
import { PAYMENT_LABEL } from "@/components/admin/status-badge";

const cell = (v: string | number | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every payment as a spreadsheet, for the accountant. */
export async function GET() {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return new Response("Please sign in.", { status: 401 });
  const rows = (await listPayments()).map((p) =>
    [p.paidAt ?? p.createdAt, p.reference, p.orderNumber, p.customer.name, p.customer.email, p.method, PAYMENT_LABEL[p.status], ...(p.status === "failed" || p.status === "abandoned" ? [0, 0, 0, 0] : [p.amount, p.refunded, p.fees, p.amount - p.refunded - p.fees])]
      .map(cell)
      .join(","),
  );
  const csv = ["Date,Reference,Order,Customer,Email,Method,Status,Amount (NGN),Refunded (NGN),Fees (NGN),Net (NGN)", ...rows].join("\n");
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="shop-tafara-payments-${day}.csv"` },
  });
}
