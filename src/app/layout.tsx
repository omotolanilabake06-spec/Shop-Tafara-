import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Shop Tafara | Made-to-order womenswear, Lagos",
    template: "%s | Shop Tafara",
  },
  description:
    "Shop Tafara is a made-to-order womenswear house in Lagos. Choose your piece, your fabric colour and your size. Every piece is made for you.",
  openGraph: { siteName: "Shop Tafara", type: "website", locale: "en_NG" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={bebas.variable}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
