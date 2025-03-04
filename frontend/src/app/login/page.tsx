"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from "firebase/auth";
import styles from "./page.module.css";
import Image from "next/image";
import { API_BASE_URL } from '@/config/constants';
import LinkedIn from '@/components/LinkedIn';

interface LoginForm {
  email: string;
  password: string;
}

const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '';

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const authFunction = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      const result = await authFunction(auth, form.email, form.password);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: idToken })
      });

      if (!response.ok) throw new Error('Authentication failed');

      const data = await response.json();
      if (data.needsOnboarding) {
        router.push('/onboarding');
      } else {
        router.push('/discovery');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      // Allow any Google account
      provider.setCustomParameters({
        prompt: 'select_account'  // Always show account selection
      });

      const result = await signInWithPopup(auth, provider)
        .catch((error) => {
          if (error.code === 'auth/popup-closed-by-user') {
            return null;
          }
          throw error;
        });

      if (!result) {
        setLoading(false);
        return;
      }

      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: idToken })
      });

      if (!response.ok) throw new Error('Authentication failed');

      const data = await response.json();
      if (data.needsOnboarding) {
        router.push('/onboarding');
      } else {
        router.push('/discovery');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInCallback = async (error: string | null, code: string | null, redirectUri: string | null) => {
    if (error) {
      console.error('LinkedIn login error:', error);
      return;
    }

    if (code) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/linkedin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) throw new Error('LinkedIn authentication failed');

        const data = await response.json();
        if (data.needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push('/discovery');
        }
      } catch (error) {
        console.error('LinkedIn auth error:', error);
        setError('Failed to sign in with LinkedIn');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to BrewNet</h1>
        <p className={styles.subtitle}>Connect with coffee lovers near you</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleEmailAuth} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={styles.input}
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className={styles.emailButton}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className={styles.googleButton}
        >
          <Image 
            src="/google-logo.svg" 
            alt="Google" 
            width={20} 
            height={20} 
            className={styles.googleLogo} 
          />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <LinkedIn
          clientId={LINKEDIN_CLIENT_ID}
          scope={['openid', 'profile', 'email']}
          callback={handleLinkedInCallback}
          className={styles.linkedinButton}
        />

        <p className={styles.toggle}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className={styles.toggleButton}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
