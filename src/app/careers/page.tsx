import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./careers.module.css";

export const metadata: Metadata = {
  title: "Careers | Ayra Collection",
  description:
    "Join the Ayra team. We are looking for passionate individuals who appreciate craftsmanship, culture, and premium fashion to grow with us.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers | Ayra Collection",
    description: "Explore career opportunities at Ayra—Pakistan's premium fashion house.",
    type: "website",
  },
};

const OPENINGS = [
  {
    title: "Digital Marketing Specialist",
    department: "Marketing",
    location: "Lahore, Pakistan",
    type: "Full-time",
    desc: "Drive Ayra's social media presence, manage paid campaigns, and craft compelling content strategies that connect with our audience.",
  },
  {
    title: "Fashion Photographer & Videographer",
    department: "Creative",
    location: "Lahore, Pakistan",
    type: "Freelance / Project",
    desc: "Capture the essence of Ayra's collections through high-end editorial photography and behind-the-scenes brand videos.",
  },
  {
    title: "E-commerce Operations Manager",
    department: "Operations",
    location: "Lahore, Pakistan",
    type: "Full-time",
    desc: "Oversee order fulfillment, customer communication, logistics, and inventory management to ensure a seamless customer experience.",
  },
  {
    title: "Fashion Designer (Eastern Couture)",
    department: "Design",
    location: "Lahore, Pakistan",
    type: "Full-time",
    desc: "Collaborate with our design atelier to develop seasonal collections rooted in traditional Eastern aesthetics and contemporary silhouettes.",
  },
];

const VALUES = [
  { icon: "⚜️", title: "Craft Excellence", desc: "We celebrate meticulous workmanship and hold the art of heritage crafting to the highest standard." },
  { icon: "🌿", title: "Thoughtful Growth", desc: "We grow with purpose—expanding into new markets while protecting the soul of the brand." },
  { icon: "🤝", title: "Artisan Community", desc: "We are committed to fair compensation and the preservation of traditional embroidery communities." },
  { icon: "✨", title: "Creative Freedom", desc: "Every team member is encouraged to bring fresh ideas to the table, regardless of their role." },
];

export default function CareersPage() {
  const baseUrl = "https://ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Careers", item: "/careers" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow">
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Join Our Team</span>
            <h1 className={styles.heroTitle}>Careers at Ayra</h1>
            <p className={styles.heroSub}>
              We are building something extraordinary. If you share a passion for heritage craftsmanship
              and modern luxury, we want to hear from you.
            </p>
          </div>
        </div>

        <div className={styles.container}>

          {/* Values */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Why Ayra</span>
              <h2 className={styles.sectionTitle}>Our Values</h2>
            </div>
            <div className={styles.valuesGrid}>
              {VALUES.map((v) => (
                <div key={v.title} className={styles.valueCard}>
                  <span className={styles.valueIcon}>{v.icon}</span>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueDesc}>{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Openings */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Open Positions</span>
              <h2 className={styles.sectionTitle}>Current Openings</h2>
              <p className={styles.sectionSub}>
                We are a growing team based in Lahore. All roles offer competitive compensation, creative autonomy, and the opportunity to shape a leading fashion brand.
              </p>
            </div>
            <div className={styles.openingsList}>
              {OPENINGS.map((job) => (
                <div key={job.title} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobDept}>{job.department}</span>
                        <span className={styles.metaSep}>·</span>
                        <span className={styles.jobLoc}>{job.location}</span>
                        <span className={styles.metaSep}>·</span>
                        <span className={`${styles.jobType} ${job.type === "Full-time" ? styles.jobTypeFull : styles.jobTypeFreelance}`}>
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`mailto:careers@ayraa.pk?subject=Application: ${job.title}`}
                      className={styles.applyBtn}
                    >
                      Apply Now
                    </a>
                  </div>
                  <p className={styles.jobDesc}>{job.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* General Application */}
          <section className={styles.generalSection}>
            <div className={styles.generalCard}>
              <div className={styles.generalLeft}>
                <h2 className={styles.generalTitle}>Don&apos;t See Your Role?</h2>
                <p className={styles.generalText}>
                  We are always open to talented individuals who bring something unique.
                  Send us your portfolio and a brief introduction—we would love to meet you.
                </p>
              </div>
              <a
                href="mailto:careers@ayraa.pk?subject=General Application"
                className={styles.generalBtn}
              >
                Send General Application
              </a>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
