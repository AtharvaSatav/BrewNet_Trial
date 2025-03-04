"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

interface Connection {
  firebaseUid: string;
  name: string;
  interests: string[];
  status: 'pending' | 'accepted';
  initiator: string;
  seen: boolean;
  loginMethod?: string;
  linkedinUrl?: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'received' | 'sent' | 'connected'>('connected');
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState({ newRequests: 0, newConnections: 0 });

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/connections/all/${user.uid}`);
        if (!response.ok) throw new Error("Failed to fetch connections");

        const data = await response.json();
        setConnections(data.connections || []);
      } catch (err) {
        console.error("Error fetching connections:", err);
        setError("Failed to load connections");
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [router]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/api/connections/unread-counts/${user.uid}`);
        if (response.ok) {
          const counts = await response.json();
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };

    fetchUnreadCounts();
  }, []);

  useEffect(() => {
    const markAsSeen = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        await fetch(`${API_BASE_URL}/api/connections/mark-seen`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            type: filter === 'received' ? 'requests' : 'connections'
          })
        });
      } catch (error) {
        console.error("Error marking as seen:", error);
      }
    };

    markAsSeen();
  }, [filter]);

  const filteredConnections = connections
    .filter(conn => {
      if (!conn) return false;
      const currentUser = auth.currentUser?.uid;
      if (filter === 'received') {
        return conn.status === 'pending' && conn.initiator !== currentUser;
      }
      if (filter === 'sent') {
        return conn.status === 'pending' && conn.initiator === currentUser;
      }
      return conn.status === 'accepted';
    })
    .sort((a, b) => {
      if (!a.seen && b.seen) return -1;
      if (a.seen && !b.seen) return 1;
      
      return a.name.localeCompare(b.name);
    });

  const markConnectionAsSeen = async (connectionId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await fetch(`${API_BASE_URL}/api/connections/mark-seen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          connectionId
        })
      });

      setConnections(prevConnections => 
        prevConnections.map(conn => 
          conn.firebaseUid === connectionId 
            ? { ...conn, seen: true }
            : conn
        )
      );
    } catch (error) {
      console.error("Error marking connection as seen:", error);
    }
  };

  const getUnseenCounts = () => {
    return {
      newRequests: connections.filter(conn => 
        !conn.seen && 
        conn.status === 'pending' && 
        conn.initiator !== auth.currentUser?.uid
      ).length,
      newConnections: connections.filter(conn => 
        !conn.seen && 
        conn.status === 'accepted'
      ).length
    };
  };

  useEffect(() => {
    setUnreadCounts(getUnseenCounts());
  }, [connections]);

  if (loading) {
    return <div className={styles.loading}>Loading connections...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      
      <header className={styles.header}>
        <button 
          onClick={() => router.push("/discovery")}
          className={styles.backButton}
        >
          ← Back to Discovery
        </button>
        <h1 className={styles.title}>My Connections</h1>
      </header>

      <div className={styles.filterButtons}>
        <button 
          className={`${styles.filterButton} ${filter === 'connected' ? styles.active : ''}`}
          onClick={() => setFilter('connected')}
        >
          Connected
          {unreadCounts.newConnections > 0 && (
            <span className={styles.badge}>{unreadCounts.newConnections}</span>
          )}
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'received' ? styles.active : ''}`}
          onClick={() => setFilter('received')}
        >
          Requests Received
          {unreadCounts.newRequests > 0 && (
            <span className={styles.badge}>{unreadCounts.newRequests}</span>
          )}
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'sent' ? styles.active : ''}`}
          onClick={() => setFilter('sent')}
        >
          Requests Sent
        </button>
      </div>

      <div className={styles.connectionsGrid}>
        {Array.isArray(filteredConnections) && filteredConnections.map((connection) => (
          connection && (
            <div key={connection.firebaseUid} className={styles.connectionCard}>
              {!connection.seen && <div className={styles.newTag}>New</div>}
              <h2 className={styles.connectionName}>{connection.name}</h2>
              <div className={styles.interestsContainer}>
                {connection.interests && connection.interests.map((interest) => (
                  <span key={interest} className={styles.interest}>
                    {interest}
                  </span>
                ))}
              </div>
              
              {connection.loginMethod === 'linkedin' && (
                <a 
                  href={connection.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkedinLink}
                >
                  <i className="fab fa-linkedin"></i> View LinkedIn Profile
                </a>
              )}

              <div className={styles.status}>
                {connection.status === 'pending' ? (
                  connection.initiator === auth.currentUser?.uid ? 
                    "Request Sent" : 
                    "Request Received"
                ) : "Connected"}
              </div>
              <button
                onClick={() => {
                  markConnectionAsSeen(connection.firebaseUid);
                  router.push(`/profile/${connection.firebaseUid}`);
                }}
                className={styles.viewButton}
              >
                View Profile
              </button>
            </div>
          )
        ))}

        {(!filteredConnections || filteredConnections.length === 0) && (
          <div className={styles.emptyState}>
            No {filter === 'connected' ? 'connections' : 'requests'} found
          </div>
        )}
      </div>
    </div>
  );
} 