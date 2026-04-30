import type { Metadata } from "next";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import MobileStickyCTA from "@/components/MobileStickyCTA";
import { siteConfig } from "@/lib/site";
import { getGtmId, isProduction } from "@/lib/env";

const indexable = isProduction();
const gtmId = getGtmId();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.shortName} | ${siteConfig.positioning}`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: [
    "Medicare Spokane",
    "Medicare Spokane WA",
    "Medicare in Spokane",
    "Health Insurance Options Spokane",
    "Medicare Advantage Spokane",
    "Medicare Supplement Spokane",
    "Medigap Spokane",
    "Medicare Part D Spokane",
    "Medicare agent Spokane",
    "Medicare broker Spokane",
    "Turning 65 Spokane",
    "Medicare Spokane Valley",
    "Medicare Liberty Lake",
    "Medicare Cheney WA",
    "Medicare Airway Heights",
    "Medicare Medical Lake",
    "Medicare Mead WA",
    "Medicare Deer Park WA",
    "Eastern Washington Medicare",
  ],
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  openGraph: {
    type: "website",
    locale: siteConfig.openGraph.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
    description: siteConfig.description,
  },
  robots: indexable
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      }
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <LocalBusinessSchema />
      </head>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileStickyCTA />
      </body>
    </html>
  );
}
