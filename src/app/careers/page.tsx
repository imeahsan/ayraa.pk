import React from "react";
import { Metadata } from "next";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getActiveJobOpenings } from "@/app/actions/careers";
import { JobOpening } from "@/types";
import styles from "./careers.module.css";

export const revalidate = 60; // Revalidate every minute

export const metadata: Metadata = {
  title: "Careers | Ayraa Collection",
  description:
    "Explore career opportunities at Ayraa and help shape a modern Pakistani fashion and lifestyle brand.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers | Ayraa Collection",
    description: "Explore career opportunities at Ayraa.",
    type: "website",
  },
};

const VALUES = [
  { icon: "Craft", title: "Craft Excellence", desc: "We care about detail, fabric quality, and polished execution." },
  { icon: "Growth", title: "Thoughtful Growth", desc: "We scale carefully while preserving exceptional product standards." },
  { icon: "Team", title: "Team Support", desc: "We work collaboratively across design, creative, operations, and care." },
  { icon: "Ideas", title: "Creative Freedom", desc: "We believe great ideas can come from anyone in any role." },
];

export default async function CareersPage() {
  const baseUrl = "https://store.ayraa.pk";
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "Careers", item: "/careers" },
  ];

  const res = await getActiveJobOpenings();
  const openings: JobOpening[] = res.success ? res.data : [];

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
              Help build a modern brand that crafts Pakistani lifestyle and wardrobe essentials with clarity and care.
            </p>
          </div>
        </div>

        <div className={styles.container}>
          {/* Values Section */}
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

          {/* Openings Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.badge}>
                {openings.length > 0 ? `${openings.length} Available Position${openings.length > 1 ? "s" : ""}` : "Positions"}
              </span>
              <h2 className={styles.sectionTitle}>Current Openings</h2>
              <p className={styles.sectionSub}>
                Explore open opportunities to join our team in Lahore or remotely.
              </p>
            </div>

            {openings.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3 className={styles.emptyStateTitle}>No Open Positions Right Now</h3>
                <p className={styles.emptyStateDesc}>
                  We do not have any active openings at the moment. However, we are always eager to connect with talented designers, marketers, and operations specialists.
                </p>
                <a
                  href="mailto:careers@ayraa.pk?subject=General Application - Ayraa Collection"
                  className={styles.emptyStateAction}
                >
                  Send General Application
                </a>
              </div>
            ) : (
              <div className={styles.openingsList}>
                {openings.map((job) => {
                  const applySubject = encodeURIComponent(`Job Application: ${job.title}`);
                  const applyEmail = job.apply_email || "careers@ayraa.pk";

                  return (
                    <div key={job.id} className={styles.jobCard}>
                      <div className={styles.jobHeader}>
                        <div>
                          <h3 className={styles.jobTitle}>{job.title}</h3>
                          <div className={styles.jobMeta}>
                            <span className={styles.jobDept}>{job.department}</span>
                            <span className={styles.metaSep}>·</span>
                            <span className={styles.jobLoc}>{job.location}</span>
                            <span className={styles.metaSep}>·</span>
                            <span
                              className={`${styles.jobType} ${
                                job.employment_type.toLowerCase().includes("full")
                                  ? styles.jobTypeFull
                                  : styles.jobTypeFreelance
                              }`}
                            >
                              {job.employment_type}
                            </span>
                            {job.salary_range && (
                              <>
                                <span className={styles.metaSep}>·</span>
                                <span className={styles.jobSalary}>{job.salary_range}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <a
                          href={`mailto:${applyEmail}?subject=${applySubject}`}
                          className={styles.applyBtn}
                        >
                          Apply Now
                        </a>
                      </div>

                      <p className={styles.jobDesc}>{job.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* General Application Banner */}
          <section className={styles.generalSection}>
            <div className={styles.generalCard}>
              <div className={styles.generalLeft}>
                <h2 className={styles.generalTitle}>Don&apos;t See Your Role?</h2>
                <p className={styles.generalText}>
                  Send your portfolio, resume, and a brief introduction to our team. We love connecting with passionate individuals.
                </p>
              </div>
              <a
                href="mailto:careers@ayraa.pk?subject=General Application - Ayraa Collection"
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
