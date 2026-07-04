import Link from "next/link";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import styles from "./not-found.module.css";

const quickLinks = [
  {
    href: "/",
    label: "Return Home",
    description: "Go back to the storefront and continue browsing.",
  },
  {
    href: "/collections",
    label: "Shop Collections",
    description: "Browse active categories and current product edits.",
  },
  {
    href: "/contact",
    label: "Contact Support",
    description: "Reach out if you expected this page to exist.",
  },
];

export default function NotFound() {
  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>404 / Page Not Found</span>
            <h1 className={styles.title}>This page is not part of the current collection.</h1>
            <p className={styles.description}>
              The link may be outdated, the product or page may have moved, or the URL is incorrect.
              Use one of the paths below to get back into the storefront.
            </p>

            <div className={styles.actions}>
              <Link href="/" className={styles.primaryAction}>
                Back to Home
              </Link>
              <Link href="/collections" className={styles.secondaryAction}>
                Browse Collections
              </Link>
            </div>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualFrame}>
              <span className={styles.visualLabel}>AYRAA</span>
              <div className={styles.visualNumber}>404</div>
              <p className={styles.visualText}>
                The requested route could not be resolved inside the current storefront.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.linksSection} aria-label="Helpful links">
          <div className={styles.linksGrid}>
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.linkCard}>
                <span className={styles.linkLabel}>{item.label}</span>
                <span className={styles.linkDescription}>{item.description}</span>
                <span className={styles.linkCta}>Open</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
