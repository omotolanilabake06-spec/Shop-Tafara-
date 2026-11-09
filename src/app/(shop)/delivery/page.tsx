import type { Metadata } from "next";
import { Section, TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Delivery & returns" };

export default function DeliveryPage() {
  return (
    <TextPage eyebrow="Help" title="Delivery & returns">
      <Section title="Made to order">
        <p>
          Every clothing piece is made after your payment goes through. Your order is ready to ship in 5–7 working days, and
          we will email you when it leaves our studio.
        </p>
      </Section>
      <Section title="Delivery">
        <p>We deliver across Nigeria. Your delivery cost is shown at checkout before you pay.</p>
        <p>TAFARA HOME products are ready made and usually ship within 1–3 working days.</p>
      </Section>
      <Section title="International orders">
        <p>We ship clothing internationally. Room sprays and reed diffusers are liquids and may not be available to every country.</p>
      </Section>
      <Section title="Returns and alterations">
        <p>
          Because each piece is made for you, we cannot accept returns for a change of mind. If something is not right with
          your order, contact us within 7 days of delivery and we will make it right.
        </p>
      </Section>
    </TextPage>
  );
}
