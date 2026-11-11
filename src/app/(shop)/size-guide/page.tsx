import type { Metadata } from "next";
import { Section, TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Size guide" };

// Shop Tafara's body measurements in inches: UK size, bust, waist, hips.
const ROWS = [
  ["6", 32, 26, 36],
  ["8", 34, 28, 38],
  ["10", 36, 30, 40],
  ["12", 38, 32, 42],
  ["14", 40, 34, 44],
  ["16", 42, 36, 46],
  ["18", 44, 38, 48],
  ["20", 46, 40, 50],
  ["22", 48, 42, 52],
] as const;

export default function SizeGuidePage() {
  return (
    <TextPage
      eyebrow="Help"
      title="Size guide"
      intro="Every piece is cut to standard UK sizes. These are body measurements in inches, not garment measurements."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left text-[14px] tabular-nums">
          <thead>
            <tr className="border-b border-ink">
              {["UK size", "Bust", "Waist", "Hips"].map((h) => (
                <th key={h} scope="col" className="caps-sm py-3 pr-4 font-normal text-ink">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([size, bust, waist, hip]) => (
              <tr key={size} className="border-b border-line">
                <th scope="row" className="py-3.5 pr-4 font-normal text-ink">
                  {size}
                </th>
                <td className="py-3.5 pr-4">{bust}&Prime;</td>
                <td className="py-3.5 pr-4">{waist}&Prime;</td>
                <td className="py-3.5 pr-4">{hip}&Prime;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-12">
        <Section title="How to measure">
          <p>Wrap a measuring tape around:</p>
          <p>
            <span className="text-ink">Bust:</span> the fullest part of your bust.
          </p>
          <p>
            <span className="text-ink">Waist:</span> the narrowest part of your waist.
          </p>
          <p>
            <span className="text-ink">Hips:</span> the fullest part of your hips.
          </p>
          <p>Measure over light clothing, keeping the tape snug but not tight.</p>
        </Section>
        <Section title="Between sizes?">
          <p>
            Size up, or message us on{" "}
            <a href="https://wa.me/2348154024094" target="_blank" rel="noreferrer" className="link-line text-ink">
              WhatsApp at +234 815 402 4094
            </a>{" "}
            and we will help you choose.
          </p>
        </Section>
      </div>
    </TextPage>
  );
}
