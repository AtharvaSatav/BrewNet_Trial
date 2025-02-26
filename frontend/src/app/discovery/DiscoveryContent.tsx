'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Profile } from '@/types/profile';
import ClientNotifications from '@/components/ClientNotifications';
import styles from './page.module.css';
// ... other imports

export default function DiscoveryContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const token = await user.getIdToken();
        const response = await fetch('http://localhost:5000/api/users/discover', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profiles');
        
        const data = await response.json();
        setProfiles(data.profiles);
      } catch (err) {
        setError('Failed to load profiles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <header className={styles.header}>
        <h1 className="text-2xl font-bold text-white">BrewNet</h1>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full rounded-full"
              />
            ) : (
              <span>{currentUser?.email?.[0].toUpperCase()}</span>
            )}
          </button>
          
          {showMenu && (
            <div className={styles.menu}>
              <button
                onClick={() => router.push('/profile')}
                className={styles.menuItem}
              >
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className={`${styles.menuItem} ${styles.signOut}`}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.grid}>
          {profiles.map((profile) => (
            <div key={profile.firebaseUid} className={styles.card}>
              <h2 className={styles.name}>{profile.name}</h2>
              <div className={styles.interests}>
                {profile.interests.map((interest) => (
                  <span key={interest} className={styles.interest}>
                    {interest}
                  </span>
                ))}
              </div>
              <button
                onClick={() => router.push(`/profile/${profile.firebaseUid}`)}
                className={styles.viewButton}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="text-center text-white py-12">
            No other users found at the moment.
          </div>
        )}
      </main>
      <ClientNotifications />
    </div>
  );
} 