"use client";

import React, { Suspense } from "react";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { LoginForm } from "@/components/auth/LoginForm";
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-on-surface font-body">
        Loading Sign In...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
