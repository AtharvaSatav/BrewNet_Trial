"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Profile } from "@/types/profile";
import ClientNotifications from "@/components/ClientNotifications";
import styles from "./page.module.css";

export default function Discovery() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setCurrentUser(user);
        try {
          // Fetch all users from the backend
          const userId = auth.currentUser?.uid;
          console.log(userId);
          //const response = await fetch('http://localhost:4200/api/auth/users');
          const response = await fetch(
            `http://localhost:4200/api/auth/users/${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            // Filter out the current user and format the profiles
            const otherUsers = data.users.filter(
              (profile: Profile) => profile.firebaseUid !== user.uid
            );
            setProfiles(otherUsers);
          } else {
            throw new Error("Failed to fetch profiles");
          }
        } catch (error) {
          console.error("Error fetching profiles:", error);
          setError("Failed to load profiles");
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Get the current user's ID before signing out
      const userId = auth.currentUser?.uid;

      if (!userId) return;

      // Update user's status in database
      const response = await fetch("http://localhost:4200/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sign-out status");
      }

      // Sign out from Firebase
      await signOut(auth);

      // Clear local storage
      localStorage.clear();

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading profiles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <header className={styles.header}>
        <div className={styles.brandName}>BrewNet</div>
        <div className={styles.profileMenu}>
          <button
            className={styles.profileButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            My Profile
          </button>
          {showMenu && (
            <div className={styles.menuDropdown}>
              <div
                className={styles.menuItem}
                onClick={() => router.push(`/profile/${currentUser?.uid}`)}
              >
                View Profile
              </div>
              <div
                className={styles.menuItem}
                onClick={() => router.push("/onboarding?update=true")}
              >
                Edit Profile
              </div>
              <div
                className={`${styles.menuItem} ${styles.signOutButton}`}
                onClick={handleSignOut}
              >
                Sign Out
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        <h1 className={styles.title}>Discover People</h1>
        <p className={styles.subtitle}>
          Connect with people who share your interests
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className={styles.grid}>
          {profiles.map((profile) => (
            <div key={profile.firebaseUid} className={styles.card}>
              <h2 className={styles.cardName}>{profile.name}</h2>
              <div className={styles.interestsContainer}>
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
