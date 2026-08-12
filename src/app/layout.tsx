import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { BRAND } from "@/lib/constants";
import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CurrencyProvider>
          <SiteChrome>{children}</SiteChrome>
          <Toaster richColors position="top-right" />
        </CurrencyProvider>
      </body>
    </html>
  );
}
