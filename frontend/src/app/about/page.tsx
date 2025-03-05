'use client';

import { useRouter } from 'next/navigation';
import styles from '../landing.module.css';

export default function AboutPage() {
  const router = useRouter();

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
            <button 
              className={`${styles.btn} ${styles.secondary}`}
              onClick={() => router.push('/discovery')}
            >
              <i className="fas fa-arrow-left"></i> Back to Discovery
            </button>
            <h1>The Most Interesting Person Here is Waiting to Meet You!</h1>
            <p className={styles.subheading}>BrewNet helps you meet like-minded people in cafés. Explore and network effortlessly!</p>
            <div className={styles.ctaButtons}>
              <button 
                className={`${styles.btn} ${styles.secondary}`} 
                onClick={scrollToHowItWorks}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks} id="how-it-works">
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

      {/* Benefits Section */}
      <section className={styles.benefits}>
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
            </div>
          </div>
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