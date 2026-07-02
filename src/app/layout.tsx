import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartDrawer } from "@/components/storefront/CartDrawer/CartDrawer";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { WhatsAppFAB } from "@/components/storefront/WhatsAppFAB";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { WebVitals } from "@/components/analytics/WebVitals";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_NAME, absoluteUrl, getSiteUrl } from "@/lib/seo";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_SEO_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: [
    "Pakistani lawn suits",
    "Pakistani pret wear",
    "festive wear Pakistan",
    "Ayraa Collection",
    "hijabs Pakistan",
    "bedsheets Pakistan",
    "COD clothing Pakistan",
  ],
  authors: [{ name: SITE_NAME, url: baseUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Fashion",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-PK": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: baseUrl,
    siteName: SITE_NAME,
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 800,
        height: 420,
        alt: "Ayraa Pakistani lawn, pret, festive wear, hijabs, and home textiles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} theme-dark`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <OrganizationJsonLd baseUrl={baseUrl} />
                <WebSiteJsonLd baseUrl={baseUrl} />
                <GoogleAnalytics />
                <WebVitals />
                {children}
                <CartDrawer />
                <WhatsAppFAB />
                <AnalyticsConsentBanner />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
