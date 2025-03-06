"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Profile } from "@/types/profile";
import ClientNotifications from "@/components/ClientNotifications";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

export default function Discovery() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCounts, setUnreadCounts] = useState({ newRequests: 0, newConnections: 0 });
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let unsubscribe: (() => void) | null = null;

    const fetchProfiles = async (userId: string) => {
      try {
        console.log("Fetching profiles for user:", userId);
        const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }

        const data = await response.json();
        console.log("Profiles with message counts:", data);
        data.forEach((profile: Profile) => {
          if (profile.unreadMessages && profile.unreadMessages > 0) {
            console.log(`${profile.name} has ${profile.unreadMessages} unread messages`);
          }
        });
        setProfiles(data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        setError("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };

    unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        fetchProfiles(user.uid);

        pollingInterval = setInterval(() => fetchProfiles(user.uid), 5000);
      } else {
        router.push("/login");
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [router]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/api/connections/unread-counts/${user.uid}`);
        if (response.ok) {
          const counts = await response.json();
          console.log("Unread counts:", counts);
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/api/chat/unread/${user.uid}`);
        const data = await response.json();
        setUnreadChats(data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread chats:', error);
      }
    };

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      const userId = auth.currentUser?.uid;

      if (!userId) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      await fetch(`${API_BASE_URL}/api/notifications/readAll/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update sign-out status");
      }

      await signOut(auth);

      localStorage.clear();

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
        {/* For mobile, this will be top row */}
        <div className={styles.topBar}>
          <div className={styles.brandName}>BrewNet</div>
          <button
            onClick={() => router.push('/about')}
            className={styles.connectionsButton}
          >
            <i className="fas fa-info-circle"></i> About Us
          </button>
        </div>

        {/* For mobile, this will move to bottom */}
        <div className={styles.headerButtons}>
          <button
            className={styles.connectionsButton}
            onClick={() => router.push('/connections')}
          >
            My Connections
            {(unreadCounts.newRequests + unreadCounts.newConnections) > 0 && (
              <span className={styles.badge}>
                {unreadCounts.newRequests + unreadCounts.newConnections}
              </span>
            )}
          </button>
          <button
            className={styles.connectionsButton}
            onClick={() => router.push('/chats')}
          >
            <i className="fas fa-comments"></i> Chats
            {unreadChats > 0 && (
              <span className={styles.badge}>{unreadChats}</span>
            )}
          </button>
          <div className={styles.profileMenu}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={styles.profileButton}
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
          {profiles.map((profile) => {
            console.log(`Rendering ${profile.name} with ${profile.unreadMessages} unread messages`);
            
            return (
              <div key={profile.firebaseUid} className={styles.card}>
                <h2 className={styles.cardName}>{profile.name}</h2>
                {(profile.unreadMessages !== undefined && profile.unreadMessages > 0) && (
                  <span className={`${styles.badge} ${styles.messageBadge}`}>
                    <i className="fas fa-envelope"></i> New Msg
                  </span>
                )}
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
            );
          })}
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
