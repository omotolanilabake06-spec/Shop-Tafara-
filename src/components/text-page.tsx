/** Simple editorial page shell for About, Delivery, Size guide and similar. */
export function TextPage({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="gutter pb-28">
      <header className="mx-auto max-w-[720px] pb-12 pt-10 text-center sm:pb-16 sm:pt-16">
        {eyebrow && <p className="caps-sm text-muted">{eyebrow}</p>}
        <h1 className="display mt-3 text-[40px] sm:text-[56px]">{title}</h1>
        {intro && <p className="mt-5 text-[14px] leading-relaxed text-muted">{intro}</p>}
      </header>
      <div className="mx-auto max-w-[720px] text-[15px] leading-[1.8] text-muted">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="caps mb-5 text-ink">{title}</h2>
      <div className="prose-tafara">{children}</div>
    </section>
  );
}
