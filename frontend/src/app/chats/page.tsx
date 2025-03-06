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
  unreadCount: number;
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

        const response = await fetch(`${API_BASE_URL}/api/chat/profiles/${user.uid}`);
        const data = await response.json();

        // Sort profiles: unread messages first, then by latest message time
        const sortedProfiles = data.profiles.sort((a: ChatProfile, b: ChatProfile) => {
          if (a.unreadCount !== b.unreadCount) {
            return b.unreadCount - a.unreadCount; // Unread messages first
          }
          if (a.lastMessageTime && b.lastMessageTime) {
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          }
          return 0;
        });

        setProfiles(sortedProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedProfiles();
    const interval = setInterval(fetchConnectedProfiles, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
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
                  <p className={styles.lastMessage}>
                    {profile.lastMessage}
                    {profile.lastMessageTime && (
                      <span className={styles.messageTime}>
                        {new Date(profile.lastMessageTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {profile.unreadCount > 0 && (
                <span className={styles.unreadBadge}>{profile.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
} 