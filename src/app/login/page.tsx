"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/storefront/Header/Header";
import { Footer } from "@/components/storefront/Footer/Footer";
import { Button } from "@/components/storefront/Button/Button";
import styles from "./auth.module.css";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    
    // Set cookie to remember where to redirect after successful login
    document.cookie = `sb-oauth-redirect-to=${encodeURIComponent(
      redirectTo
    )}; path=/; max-age=600; SameSite=Lax${
      window.location.protocol === "https:" ? "; Secure" : ""
    }`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>Welcome back to Ayraa luxury fashion.</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} className={styles.form}>
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

            <div className={styles.forgotPasswordContainer}>
              <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                Forgot your password?
              </Link>
            </div>

            <div className={styles.submitButtonWrapper}>
              <Button type="submit" variant="luxury" size="lg" fullWidth isLoading={isLoading}>
                Sign In
              </Button>
            </div>
          </form>

          <div className={styles.dividerContainer}>
            <hr className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <hr className={styles.dividerLine} />
          </div>

          <div className={styles.oauthContainer}>
            <button
              onClick={handleGoogleLogin}
              className={styles.oauthButton}
              type="button"
            >
              <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.69 5.69 0 0 1 8.24 12.8a5.69 5.69 0 0 1 5.751-5.714c1.455 0 2.766.549 3.766 1.455l3.203-3.2A9.902 9.902 0 0 0 13.991 2c-5.514 0-10 4.486-10 10s4.486 10 10 10c5.514 0 10-4.486 10-10 0-.58-.063-1.16-.188-1.715H12.24Z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className={styles.footerText}>
            <span>New to Ayraa?</span>{" "}
            <Link href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`} className={styles.link}>
              Create account
            </Link>
          </div>
        </div>
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
