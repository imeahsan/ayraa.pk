import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import styles from "./careers.module.css";

export const metadata: Metadata = {
  title: "Careers | Ayraa Collection",
  description:
    "Explore career opportunities at Ayraa and help shape a Pakistani fashion and lifestyle brand.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers | Ayraa Collection",
    description: "Explore career opportunities at Ayraa.",
    type: "website",
  },
};

const OPENINGS = [
  {
    title: "Digital Marketing Specialist",
    department: "Marketing",
    location: "Lahore, Pakistan",
    type: "Full-time",
    desc: "Run social media, paid campaigns, and content that helps customers discover the brand.",
  },
  {
    title: "Fashion Photographer & Videographer",
    department: "Creative",
    location: "Lahore, Pakistan",
    type: "Freelance / Project",
    desc: "Create product and campaign imagery that feels clean, modern, and commercially strong.",
  },
  {
    title: "E-commerce Operations Manager",
    department: "Operations",
    location: "Lahore, Pakistan",
    type: "Full-time",
    desc: "Oversee fulfillment, inventory, customer communication, and order flow.",
  },
];

const VALUES = [
  { icon: "Craft", title: "Craft Excellence", desc: "We care about detail, fit, and polished execution." },
  { icon: "Growth", title: "Thoughtful Growth", desc: "We scale carefully and keep the brand voice consistent." },
  { icon: "Team", title: "Team Support", desc: "We work closely across creative, operations, and customer care." },
  { icon: "Ideas", title: "Creative Freedom", desc: "Good ideas matter, no matter the role they come from." },
];

export default function CareersPage() {
  const baseUrl = "https://store.ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Careers", item: "/careers" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg transition-colors duration-500 ease-out">
      <BreadcrumbJsonLd items={breadcrumbItems} baseUrl={baseUrl} />
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Join Our Team</span>
            <h1 className={styles.heroTitle}>Careers at Ayraa</h1>
            <p className={styles.heroSub}>
              Help build a brand that serves Pakistani wardrobe needs with clarity and care.
            </p>
          </div>
        </div>

        <div className={styles.container}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Why Ayraa</span>
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>Open Positions</span>
              <h2 className={styles.sectionTitle}>Current Openings</h2>
              <p className={styles.sectionSub}>
                We are a growing team based in Lahore. Reach out if you want to help shape the next phase of the brand.
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

          <section className={styles.generalSection}>
            <div className={styles.generalCard}>
              <div className={styles.generalLeft}>
                <h2 className={styles.generalTitle}>Don&apos;t See Your Role?</h2>
                <p className={styles.generalText}>
                  Send your portfolio and a short introduction if you think you can contribute in a useful way.
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
