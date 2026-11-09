import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Phase 3: guest checkout, delivery rates and Paystack payment replace this page.
export default function CheckoutPage() {
  return (
    <TextPage eyebrow="Checkout" title="Almost there" intro="Secure payment by card, bank transfer and USSD is being connected.">
      <p className="text-center">
        <Link href="/cart" className="caps link-line text-ink">
          Back to your bag
        </Link>
      </p>
    </TextPage>
  );
}
