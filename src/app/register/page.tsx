"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import styles from "./auth.module.css";

function RegisterContent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Sign up with Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Direct insert profile backup to ensure profiles record exists
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "customer",
      });

      router.push(redirectTo);
      router.refresh();
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Ayraa to track orders and shop luxury prêt.</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.fieldContainer}>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldContainer}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldContainer}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldContainer}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.submitButtonWrapper}>
              <Button type="submit" variant="luxury" size="lg" fullWidth isLoading={isLoading}>
                Register Account
              </Button>
            </div>
          </form>

          <div className={styles.footerText}>
            <span>Already have an account?</span>{" "}
            <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} className={styles.link}>
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-on-surface font-body">
        Loading Register...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
