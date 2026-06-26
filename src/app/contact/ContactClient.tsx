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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />
      
      <main className="grow pt-20 md:pt-16">
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>
            Contact Us
          </h1>
          
          <div className={styles.layout}>
            {/* Contact details */}
            <div className={styles.detailsCol}>
              <h2 className={styles.sectionHeading}>
                Get In Touch
              </h2>
              <p className={styles.text}>
                For custom order queries, sizing advice, or feedback, please contact our customer care team.
              </p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  <div>
                    <h4 className={styles.infoTitle}>
                      Flagship Studio
                    </h4>
                    <p className={styles.infoText}>Block 4, Clifton, Karachi, Pakistan</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📞</span>
                  <div>
                    <h4 className={styles.infoTitle}>
                      Phone Helpline
                    </h4>
                    <p className={styles.infoText}>+92 21 111-999-888 (10AM - 6PM PKT)</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>✉️</span>
                  <div>
                    <h4 className={styles.infoTitle}>
                      Email Support
                    </h4>
                    <p className={styles.infoText}>care@ayraacollection.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={styles.formCol}>
              {submitted ? (
                <div className={styles.successCard}>
                  <span className={styles.successIcon}>✓</span>
                  <h3 className={styles.successTitle}>Message Sent!</h3>
                  <p className={styles.successText}>
                    Thank you for contacting Ayraa. Our client care team will respond to you within 24 business hours.
                  </p>
                  <Button variant="luxury" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <h2 className={styles.sectionHeading}>
                    Send A Message
                  </h2>
                  
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
                      Submit Message
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
