'use client';

import { useState } from 'react';
import styles from './IntentPrompt.module.css';
import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';

interface IntentPromptProps {
  onComplete: () => void;
}

export default function IntentPrompt({ onComplete }: IntentPromptProps) {
  const [intent, setIntent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/update-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ intent })
      });

      if (!response.ok) {
        throw new Error('Failed to update intent');
      }

      const data = await response.json();
      if (data.success) {
        onComplete();
      } else {
        throw new Error(data.error || 'Failed to update intent');
      }
    } catch (error) {
      console.error('Error updating intent:', error);
      setError('Failed to update intent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>What brings you here today?</h2>
        <p>Let others know what you're looking for</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g., Looking for co-founder, Frontend Developer seeking opportunities..."
            className={styles.input}
            required
          />
          <button 
            type="submit" 
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
} 