'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import styles from './landing.module.css';
import { API_BASE_URL } from '@/config/constants';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError('');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
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

      await handleAuthSuccess(result.user);
    } catch (error) {
      console.error('Auth error:', error);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First check the sign-in methods for this email
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      // If email is registered with Google
      if (methods.includes('google.com')) {
        setError('This email is registered with Google. Please use "Sign in with Google" instead.');
        setLoading(false);
        return;
      }

      // Try to sign in first regardless of whether email exists
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/discovery');
        return;
      } catch (signInError: any) {
        // If user doesn't exist, create new account
        if (signInError.code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push('/onboarding');
            return;
          } catch (signUpError: any) {
            switch (signUpError.code) {
              case 'auth/weak-password':
                setError('Password should be at least 6 characters');
                break;
              case 'auth/invalid-email':
                setError('Please enter a valid email address');
                break;
              default:
                setError(signUpError.message);
            }
          }
        } else if (signInError.code === 'auth/wrong-password') {
          setError('Incorrect password. Please try again.');
        } else {
          setError(signInError.message);
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    const idToken = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    });

    if (!response.ok) throw new Error('Authentication failed');

    const data = await response.json();
    if (data.needsOnboarding) {
      router.push('/onboarding');
    } else {
      router.push('/discovery');
    }
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>The Most Interesting Person Here is Waiting to Meet You!</h1>
            <p className={styles.subheading}>BrewNet helps you meet like-minded people in cafés. Sign in, explore, and network effortlessly!</p>
            
            {!showEmailForm ? (
              <div className={styles.authButtons}>
                <div className={styles.ctaButtons}>
                  <button 
                    className={`${styles.btn} ${styles.primary}`} 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <i className="fab fa-google"></i> 
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                  </button>

                  <button 
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={() => setShowEmailForm(true)}
                  >
                    Sign in with Email
                  </button>
                </div>
                
                <button 
                  className={`${styles.btn} ${styles.learnMoreBtn}`} 
                  onClick={scrollToHowItWorks}
                >
                  Learn More
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
                {error && <div className={styles.error}>{error}</div>}
                <button 
                  type="submit" 
                  className={`${styles.btn} ${styles.primary}`}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className={`${styles.btn} ${styles.secondary}`}
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits} id="how-it-works">
        <div className={styles.container}>
          <h2>Why Use BrewNet?</h2>
          <div className={styles.benefitsGrid}>
            {[
              { icon: 'users', title: 'Meet New People', desc: 'Discover professionals & like-minded individuals.' },
              { icon: 'comments', title: 'Break the Ice', desc: 'Skip awkward intros with shared interests.' },
              { icon: 'coffee', title: 'Make Your Café Visit More Meaningful', desc: 'Networking, casual convos, or collaborations.' },
              { icon: 'check-circle', title: '100% Free & Easy to Use', desc: 'Just sign in and start connecting.' }
            ].map((benefit, index) => (
              <div key={index} className={styles.benefitCard}>
                <i className={`fas fa-${benefit.icon}`}></i>
                <h3>{benefit.title}</h3>
                <p>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2>How It Works</h2>
          <div className={styles.stepsContainer}>
            {[
              { number: 1, title: 'Check In', desc: 'Log in and see who\'s around.' },
              { number: 2, title: 'Discover People', desc: 'View profiles of others in the café.' },
              { number: 3, title: 'Connect & Meet', desc: 'Send requests, meet in-person and start conversations.' }
            ].map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepIcon}>{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Trend Section */}
      <section className={styles.globalTrend}>
        <div className={styles.container}>
          <h2>The Global Trend is Coming to India</h2>
          <div className={styles.trendContainer}>
            <div className={styles.mapContainer}>
              <div className={`${styles.mapPoint} ${styles.us} ${styles.pulse}`}>
                <div className={styles.pointDot}></div>
                <div className={styles.pointInfo}>
                  <h4>United States</h4>
                  <p>A significant portion of business ideas have originated in cafes.</p>
                </div>
              </div>
              <div className={`${styles.mapPoint} ${styles.france} ${styles.pulse}`}>
                <div className={styles.pointDot}></div>
                <div className={styles.pointInfo}>
                  <h4>France</h4>
                  <p>Cafe networking is a popular way to meet new people and build connections.</p>
                </div>
              </div>
              <div className={`${styles.mapPoint} ${styles.india} ${styles.pulse}`}>
                <div className={styles.pointDot}></div>
                <div className={`${styles.pointInfo} ${styles.highlight}`}>
                  <h4>India</h4>
                  <p>The Next Big Hub</p>
                  <span className={styles.comingSoon}>Coming Soon!</span>
                </div>
              </div>
            </div>
            <div className={styles.trendMessage}>
              <p className={styles.trendQuote}>"The biggest ideas in the West started in coffee shops. Let's make Indian cafés the next hub for networking!"</p>
              <button 
                className={`${styles.btn2} ${styles.secondary} ${styles.trendCta}`} 
                onClick={() => router.push('/login')}
              >
                Be the first to experience the change!
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2>Ready to find your next coffee companion?</h2>
          <p>Join BrewNet today and start connecting!</p>
          
          {!showEmailForm ? (
            <div className={styles.authButtons}>
              <div className={styles.ctaButtons}>
                <button 
                  className={`${styles.btn} ${styles.primary}`} 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <i className="fab fa-google"></i> 
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <button 
                  className={`${styles.btn} ${styles.primary}`}
                  onClick={() => setShowEmailForm(true)}
                >
                  Sign in with Email
                </button>
              </div>
              
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className={styles.emailForm1}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input1}
                required
              />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input1}
                required
              />
              {error && <div className={styles.error}>{error}</div>}
              <button 
                type="submit" 
                className={`${styles.btn} ${styles.primary}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className={`${styles.btn} ${styles.secondary}`}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="tel:+918308655877">Contact Us: +91 8308655877</a>
        </div>
      </footer>
    </div>
  );
} 