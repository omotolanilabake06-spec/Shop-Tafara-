import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Empty, PageHeader, Stat, button, input, th } from "@/components/admin/ui";
import { formatNaira } from "@/lib/format";
import { listCustomers } from "@/lib/orders/store";
import { formatStamp } from "@/lib/working-days";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <PageHeader title="Customers" description="Everyone who has placed an order. Guest checkout means no accounts; customers are matched by email." />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <Customers searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/admin/customers">, "searchParams">) {
  const [{ q: rawQ }, customers] = await Promise.all([searchParams, listCustomers()]);
  const q = typeof rawQ === "string" ? rawQ.trim().toLowerCase() : "";
  const shown = customers.filter((c) => !q || [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(q)));
  const repeat = customers.filter((c) => c.orders > 1).length;
  const spent = customers.reduce((n, c) => n + c.spent, 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Customers" value={customers.length} />
        <Stat label="Came back for more" value={repeat} note="More than one order" />
        <Stat label="Average spend" value={formatNaira(customers.length ? Math.round(spent / customers.length) : 0)} note="Per customer, all time" />
      </div>

      <form className="mt-8 flex max-w-[420px] gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search customers" className={input} />
        <button type="submit" className={button.secondary}>
          Search
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-[4px] border border-line bg-paper">
        {shown.length === 0 ? (
          <Empty title="No customers found" />
        ) : (
          <table className="w-full">
            <thead className="hidden border-b border-line bg-[#faf8f5] md:table-header-group">
              <tr>
                <th className={th}>Customer</th>
                <th className={th}>Phone</th>
                <th className={th}>Orders</th>
                <th className={th}>Spent</th>
                <th className={th}>Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((c) => (
                <tr key={c.email} className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-5 py-4 md:table-row md:p-0">
                  <td className="md:px-5 md:py-4">
                    <span className="font-medium">{c.name}</span>
                    <a href={`mailto:${c.email}`} className="block text-[14px] text-soft hover:text-ink">
                      {c.email}
                    </a>
                  </td>
                  <td className="text-right text-[15px] md:px-5 md:py-4 md:text-left">
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="tabular-nums hover:underline">
                      {c.phone}
                    </a>
                    <span className="block text-[13px] text-soft">{c.city}</span>
                  </td>
                  <td className="md:px-5 md:py-4">
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className={button.quiet}>
                      {c.orders} {c.orders === 1 ? "order" : "orders"}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums md:px-5 md:py-4 md:text-left">{formatNaira(c.spent)}</td>
                  <td className="col-span-2 text-[14px] md:px-5 md:py-4">
                    <Link href={`/admin/orders/${c.lastOrderNumber}`} className="tabular-nums hover:underline">
                      {c.lastOrderNumber}
                    </Link>
                    <span className="text-soft"> · {formatStamp(c.lastOrder)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
