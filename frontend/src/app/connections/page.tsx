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
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'received' | 'sent' | 'connected'>('connected');
  const [error, setError] = useState<string | null>(null);

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

  const filteredConnections = connections.filter(conn => {
    if (!conn) return false;
    const currentUser = auth.currentUser?.uid;
    if (filter === 'received') {
      return conn.status === 'pending' && conn.initiator !== currentUser;
    }
    if (filter === 'sent') {
      return conn.status === 'pending' && conn.initiator === currentUser;
    }
    return conn.status === 'accepted';
  });

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
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'received' ? styles.active : ''}`}
          onClick={() => setFilter('received')}
        >
          Requests Received
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
              <h2 className={styles.connectionName}>{connection.name}</h2>
              <div className={styles.interestsContainer}>
                {connection.interests && connection.interests.map((interest) => (
                  <span key={interest} className={styles.interest}>
                    {interest}
                  </span>
                ))}
              </div>
              <div className={styles.status}>
                {connection.status === 'pending' ? (
                  connection.initiator === auth.currentUser?.uid ? 
                    "Request Sent" : 
                    "Request Received"
                ) : "Connected"}
              </div>
              <button
                onClick={() => router.push(`/profile/${connection.firebaseUid}`)}
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