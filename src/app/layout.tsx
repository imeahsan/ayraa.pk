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

const baseUrl = "https://ayraa.pk";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Ayraa | Pakistani Lawn, Pret, and Festive Wear",
    template: "%s | Ayraa Collection"
  },
  description:
    "Ayraa offers Pakistani lawn, pret, festive wear, and home pieces with considered fabrics and modern everyday grace.",
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
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Ayraa | Pakistani Lawn, Pret, and Festive Wear",
    description:
      "Ayraa offers Pakistani lawn, pret, festive wear, and home pieces with considered fabrics and modern everyday grace.",
    url: baseUrl,
    siteName: "Ayraa Collection",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 800,
        height: 420,
        alt: "Ayraa Pakistani lawn, pret, and festive wear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayraa | Pakistani Lawn, Pret, and Festive Wear",
    description:
      "Ayraa offers Pakistani lawn, pret, festive wear, and home pieces with considered fabrics and modern everyday grace.",
    images: ["/og-image.jpg"],
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
                {children}
                <CartDrawer />
                <WhatsAppFAB />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
