'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

interface ChatProfile {
  firebaseUid: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export default function Chats() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectedProfiles = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/connections/all/${user.uid}`);
        const data = await response.json();

        // Filter only accepted connections
        const acceptedConnections = data.connections.filter(
          (connection: any) => connection.status === 'accepted'
        );

        setProfiles(acceptedConnections);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedProfiles();
  }, [router]);

  if (loading) {
    return <div className={styles.loading}>Loading chats...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <header className={styles.header}>
        <button
          onClick={() => router.push('/discovery')}
          className={styles.backButton}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h1 className={styles.title}>Chats</h1>
      </header>

      <main className={styles.chatList}>
        {profiles.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No connections yet. Connect with people to start chatting!</p>
            <button 
              onClick={() => router.push('/discovery')}
              className={styles.discoverButton}
            >
              Discover People
            </button>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.firebaseUid}
              className={styles.chatItem}
              onClick={() => router.push(`/chat/${profile.firebaseUid}`)}
            >
              <div className={styles.chatInfo}>
                <h3 className={styles.chatName}>{profile.name}</h3>
                {profile.lastMessage && (
                  <p className={styles.lastMessage}>{profile.lastMessage}</p>
                )}
              </div>
              {profile.unreadCount && profile.unreadCount > 0 && (
                <span className={styles.unreadBadge}>{profile.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
} 