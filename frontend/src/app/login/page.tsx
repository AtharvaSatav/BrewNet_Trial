"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Update backend URL to use API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();

      if (data.needsOnboarding) {
        router.push("/onboarding");
      } else {
        router.push("/discovery");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to BrewNet</h1>
        <p className={styles.subtitle}>Connect with coffee lovers</p>

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.googleButton}
        >
          {!loading && (
            <Image
              src="/google-logo.svg"
              alt="Google"
              width={20}
              height={20}
              className={styles.googleLogo}
            />
          )}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
