'use client';

import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <div className={styles.cup}>
            <div className={styles.liquid}>
              <div className={styles.bubbles}></div>
            </div>
          </div>
          <div className={styles.handle}></div>
          <div className={styles.steam}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <p className={styles.loadingText}>Loading profiles...</p>
      </div>
    </div>
  );
} 