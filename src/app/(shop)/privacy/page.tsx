import type { Metadata } from "next";
import { Section, TextPage } from "@/components/text-page";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Privacy & cookies" };

export default async function PrivacyPage() {
  const { store } = await getSettings();
  return (
    <TextPage title="Privacy & cookies" intro="What we collect, why we collect it and the choices you have.">
      <Section title="What we collect">
        <p>When you order, we collect your name, email, phone number and delivery address so we can make and deliver your order and keep you updated.</p>
        <p>If you join our newsletter, we keep your email address and first name, if you give it, along with the date you signed up.</p>
      </Section>
      <Section title="How we use it">
        <p>We use order details to fulfil your order and for our records. We use newsletter details only to send news about Shop Tafara. We do not sell your details.</p>
      </Section>
      <Section title="Who we share it with">
        <p>We share only what is needed with the companies that help us run the shop, such as our payment, delivery, email and website hosting providers.</p>
      </Section>
      <Section title="Cookies and browser storage">
        <div id="cookies" className="scroll-mt-32">
          <p>
            Essential storage keeps your bag and remembers your cookie and newsletter choices on your device. A sign-in cookie is used only by our staff in the admin
            area. The site does not currently use analytics or advertising cookies, and any we add later would only run if you choose &ldquo;Accept all&rdquo;.
          </p>
          <p className="mt-[1em]">You can change your choice at any time using &ldquo;Cookie settings&rdquo; at the bottom of any page.</p>
        </div>
      </Section>
      <Section title="Your choices">
        <p>
          You can unsubscribe from our newsletter at any time, or ask us to see, correct or delete your details, by emailing{" "}
          <a href={`mailto:${store.email}`} className="text-ink underline underline-offset-4">
            {store.email}
          </a>
          .
        </p>
      </Section>
    </TextPage>
  );
}
