"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { LoginForm } from "@/components/auth/LoginForm";
import Loading from "@/app/loading";
import styles from "./auth.module.css";

function LoginContent() {
  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContent}>
        <LoginForm />
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginContent />
    </Suspense>
  );
}
