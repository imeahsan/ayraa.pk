"use client";

import React, { useState } from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import styles from "./contact.module.css";

export default function ContactClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Subject: ${subject.trim() || "General enquiry"}`,
      "",
      message.trim(),
    ].join("\n");

    const whatsappUrl = `https://wa.me/923295822495?text=${encodeURIComponent(body)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />

      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Contact Us</h1>

          <div className={styles.layout}>
            <div className={styles.detailsCol}>
              <h2 className={styles.sectionHeading}>Get In Touch</h2>
              <p className={styles.text}>
                For order status, sizing advice, delivery questions, or general support, send us a
                message and we will respond on WhatsApp.
              </p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>Location</span>
                  <div>
                    <h4 className={styles.infoTitle}>Flagship Studio</h4>
                    <p className={styles.infoText}>Block 4, Clifton, Karachi, Pakistan</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>Phone</span>
                  <div>
                    <h4 className={styles.infoTitle}>Phone Helpline</h4>
                    <p className={styles.infoText}>+92 21 111-999-888 (10AM - 6PM PKT)</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>Email</span>
                  <div>
                    <h4 className={styles.infoTitle}>Email Support</h4>
                    <p className={styles.infoText}>care@ayraa.pk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formCol}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={styles.sectionHeading}>Send A Message</h2>

                <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="Subject (Optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className="flex flex-col">
                  <textarea
                    placeholder="Your Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={styles.textarea}
                    rows={4}
                    required
                  />
                </div>

                <div className="mt-2">
                  <Button type="submit" variant="luxury" size="lg" fullWidth isLoading={isSubmitting}>
                    Continue on WhatsApp
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
