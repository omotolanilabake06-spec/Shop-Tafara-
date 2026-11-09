// Admin building blocks. The admin favours legibility over the shop's editorial styling:
// 15px regular text, sentence-case labels and strong contrast.
import Link from "next/link";

export const input =
  "block h-11 w-full rounded-[3px] border border-[#d6cfc5] bg-paper px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-[#9a9189] focus:border-ink focus:ring-1 focus:ring-ink disabled:bg-stone";
/** Narrow number box, e.g. a count of days. */
export const smallInput = input.replace("w-full", "w-20");
export const textarea =
  "block min-h-[110px] w-full rounded-[3px] border border-[#d6cfc5] bg-paper px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#9a9189] focus:border-ink focus:ring-1 focus:ring-ink";

const base =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[3px] px-5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const button = {
  primary: `${base} bg-ink text-paper hover:bg-[#2c2824]`,
  secondary: `${base} border border-[#cfc7bc] bg-paper text-ink hover:border-ink`,
  danger: `${base} border border-sold bg-paper text-sold hover:bg-sold hover:text-paper`,
  dangerSolid: `${base} bg-sold text-paper hover:bg-[#7f2f25]`,
  quiet: "inline-flex items-center gap-1.5 text-[14px] font-medium text-ink underline decoration-[#cfc7bc] underline-offset-4 hover:decoration-ink",
};

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-soft hover:text-ink">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[34px] font-normal leading-tight text-ink sm:text-[40px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-[70ch] text-[15px] leading-relaxed text-soft">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  flush,
  className = "",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** No inner padding, for tables and lists that run edge to edge. */
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-[4px] border border-line bg-paper ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-[16px] font-medium text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-soft">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "" : "px-5 py-5 sm:px-6"}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[14px] font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-[13px] leading-snug text-soft">{hint}</span>}
      {error && <span className="mt-1.5 block text-[13px] font-medium text-sold">{error}</span>}
    </label>
  );
}

const TONES = {
  neutral: "bg-[#eee9e2] text-[#3d3833]",
  amber: "bg-[#f6e8cf] text-[#6b4a12]",
  violet: "bg-[#e9e4f4] text-[#3f3566]",
  green: "bg-[#e1eedd] text-[#2b5a2c]",
  blue: "bg-[#dcebf0] text-[#24505c]",
  red: "bg-[#f6dcd7] text-[#8a2c21]",
  solidRed: "bg-sold text-paper",
};
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-[13px] font-medium leading-normal ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-serif text-[22px] text-ink">{title}</p>
      {children && <div className="mt-2 text-[15px] text-soft">{children}</div>}
    </div>
  );
}

/** Table header cell. */
export const th = "px-5 py-3 text-left text-[13px] font-medium text-soft";
export const td = "px-5 py-4 align-top text-[15px]";

export function Stat({ label, value, note, href, tone }: { label: string; value: React.ReactNode; note?: React.ReactNode; href?: string; tone?: "red" | "green" }) {
  const body = (
    <>
      <span className="block text-[14px] text-soft">{label}</span>
      <span className={`mt-1 block break-words font-serif text-[26px] leading-tight lining-nums tabular-nums sm:text-[34px] ${tone === "red" ? "text-sold" : tone === "green" ? "text-ok" : "text-ink"}`}>
        {value}
      </span>
      {note && <span className="mt-0.5 block text-[13px] text-soft">{note}</span>}
    </>
  );
  return href ? (
    <Link href={href} className="block min-w-0 rounded-[4px] border border-line bg-paper px-4 py-4 transition-colors hover:border-[#cfc7bc] sm:px-5">
      {body}
    </Link>
  ) : (
    <div className="min-w-0 rounded-[4px] border border-line bg-paper px-4 py-4 sm:px-5">{body}</div>
  );
}

/** A label and value on one line, for detail panels. */
export function Pair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[15px]">
      <dt className="text-soft">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
