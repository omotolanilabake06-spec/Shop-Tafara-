import type { Metadata } from "next";
import { Section, TextPage } from "@/components/text-page";
import { getSettings } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { type DeliveryZone, zoneRegion } from "@/lib/types";

export const metadata: Metadata = { title: "Delivery & returns" };

const GROUPS = [
  { title: "Lagos delivery zones", match: ["lagos"] },
  { title: "Interstate delivery zones", match: ["nigeria"] },
  { title: "International & pickup", match: ["international", "pickup"] },
];

export default async function DeliveryPage() {
  const settings = await getSettings();
  const zones = settings.delivery.filter((z) => z.active);

  return (
    <TextPage eyebrow="Help" title="Delivery & returns">
      <Section title="Made to order">
        <p>
          Every clothing piece is made after your payment goes through. Your order is ready to ship in 5–7 working days, and
          we will email you when it leaves our studio. The delivery times below start from then.
        </p>
      </Section>
      {GROUPS.map((g) => {
        const list = zones.filter((z) => g.match.includes(zoneRegion(z)));
        return list.length ? (
          <Section key={g.title} title={g.title}>
            <ZoneTable zones={list} />
          </Section>
        ) : null;
      })}
      <Section title="Returns and alterations">
        <p>
          Because each piece is made for you, we cannot accept returns for a change of mind. If something is not right with
          your order, contact us within 7 days of delivery and we will make it right.
        </p>
      </Section>
    </TextPage>
  );
}

function ZoneTable({ zones }: { zones: DeliveryZone[] }) {
  return (
    <dl className="not-prose divide-y divide-line border-y border-line">
      {zones.map((z) => (
        <div key={z.id} className="flex items-start justify-between gap-6 py-4">
          <div>
            <dt className="text-[15px] text-ink">{z.name}</dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-muted">{z.description}</dd>
          </div>
          <dd className="shrink-0 text-[15px] tabular-nums text-ink">{z.fee ? formatNaira(z.fee) : "Free"}</dd>
        </div>
      ))}
    </dl>
  );
}
