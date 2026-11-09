import type { Metadata } from "next";
import { Section, TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Size guide" };

// Body measurements in centimetres. Placeholder chart: replace with Shop Tafara's own block measurements.
const ROWS = [
  ["6", 78, 60, 86],
  ["8", 82, 64, 90],
  ["10", 87, 69, 95],
  ["12", 92, 74, 100],
  ["14", 97, 79, 105],
  ["16", 102, 84, 110],
  ["18", 107, 89, 115],
] as const;

export default function SizeGuidePage() {
  return (
    <TextPage eyebrow="Help" title="Size guide" intro="All pieces are cut to standard UK sizes. Measure over light clothing and compare with the chart below.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-left text-[14px] tabular-nums">
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
                <td className="py-3.5 pr-4">{bust} cm</td>
                <td className="py-3.5 pr-4">{waist} cm</td>
                <td className="py-3.5 pr-4">{hip} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-12">
        <Section title="How to measure">
          <p>
            <span className="text-ink">Bust:</span> around the fullest part of your chest, keeping the tape level.
          </p>
          <p>
            <span className="text-ink">Waist:</span> around the narrowest part of your waist.
          </p>
          <p>
            <span className="text-ink">Hips:</span> around the fullest part of your hips, feet together.
          </p>
        </Section>
        <Section title="Between sizes?">
          <p>For fitted pieces such as corsets, choose the larger size. For relaxed pieces, choose your usual size.</p>
        </Section>
      </div>
    </TextPage>
  );
}
