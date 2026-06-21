import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartDrawer } from "@/components/storefront/CartDrawer/CartDrawer";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { WhatsAppFAB } from "@/components/storefront/WhatsAppFAB";

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

const baseUrl = "https://ayraacollection.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Ayraa | Premium Eastern Luxury Fashion",
    template: "%s | Ayraa Collection"
  },
  description:
    "Exquisite Eastern couture and luxury prêt-à-porter collection for women. Indulge in premium quality fabrics, intricate craftsmanship, and timeless gold-threaded embroidery.",
  keywords: [
    "Eastern Fashion",
    "Luxury Pret",
    "Couture",
    "Ayraa Collection",
    "Pakistani Designer Wear",
  ],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Ayraa | Premium Eastern Luxury Fashion",
    description:
      "Exquisite Eastern couture and luxury prêt-à-porter collection.",
    url: baseUrl,
    siteName: "Ayraa Collection",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayraa | Premium Eastern Luxury Fashion",
    description:
      "Exquisite Eastern couture and luxury prêt-à-porter collection.",
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
              <OrganizationJsonLd baseUrl={baseUrl} />
              {children}
              <CartDrawer />
              <WhatsAppFAB />
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

