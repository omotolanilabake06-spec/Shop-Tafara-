import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge, Card, PageHeader, button } from "@/components/admin/ui";
import { getAdminSettings } from "@/lib/db/settings";
import { resetDemoAction } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Store details, delivery prices, production times and notifications." />
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-[4px] bg-paper/70" />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const settings = await getAdminSettings();
  // Which services are connected. Keys live in the hosting environment, never in the admin.
  const services = [
    { name: "Database (Supabase)", on: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), off: "Not connected" },
    { name: "Payments (Paystack)", on: Boolean(process.env.PAYSTACK_SECRET_KEY), off: "Not connected. Checkout is in preview" },
    { name: "Email (Resend)", on: Boolean(process.env.RESEND_API_KEY), off: "Not connected. Emails are logged, not sent" },
    { name: "Text messages (Termii)", on: Boolean(process.env.TERMII_API_KEY), off: "Not connected. Texts are logged, not sent" },
  ];

  return (
    <div className="space-y-6">
      <SettingsForm initial={settings} />

      <Card title="Connected services">
        <ul className="divide-y divide-line">
          {services.map((s) => (
            <li key={s.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="font-medium">{s.name}</span>
              {s.on ? <Badge tone="green">Connected</Badge> : <span className="text-[14px] text-soft">{s.off}</span>}
            </li>
          ))}
        </ul>
      </Card>

      {process.env.DEMO_DATA === "on" && (
        <Card title="Demo data" description="Puts back the sample orders and payments, and removes any orders added since. Products are not affected.">
          <form action={resetDemoAction}>
            <SubmitButton pending="Resetting…" className={button.danger}>
              Reset demo data
            </SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
