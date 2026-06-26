"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/storefront/Button/Button";
import styles from "@/app/login/auth.module.css";

interface LoginFormProps {
  redirectTo?: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

function LoginFormInner({ redirectTo, onSuccess, onClose }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = createClient();

  const queryRedirect = searchParams.get("redirectTo") || "/";
  const effectiveRedirectTo = redirectTo === undefined ? queryRedirect : redirectTo;
  const oauthRedirectTarget = effectiveRedirectTo || pathname || "/";

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
      return;
    }

    if (effectiveRedirectTo) {
      router.push(effectiveRedirectTo);
      router.refresh();
    } else {
      onSuccess?.();
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);

    document.cookie = `sb-oauth-redirect-to=${encodeURIComponent(
      oauthRedirectTarget
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
    <div className={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
        <div>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>Welcome back to Ayraa luxury fashion.</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-on-surface-muted)",
              fontSize: "28px",
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        ) : null}
      </div>

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
        <Link href={`/register?redirectTo=${encodeURIComponent(effectiveRedirectTo || "/")}`} className={styles.link}>
          Create account
        </Link>
      </div>
    </div>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg text-on-surface font-body">
          Loading Sign In...
        </div>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  );
}
