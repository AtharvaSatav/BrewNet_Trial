'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import styles from './page.module.css';

interface ConnectionStatus {
  status: 'none' | 'pending' | 'accepted';
  initiator?: string;
}

interface Profile {
  firebaseUid: string;
  name: string;
  interests: string[];
  gender: string;
}

export default function ProfileViewContent() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'none' });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:5000/api/users/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        setProfile(data.user);

        // Fetch connection status
        const statusResponse = await fetch(
          `http://localhost:5000/api/connections/status/${user.uid}/${params.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setConnectionStatus(statusData);
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.id, router]);

  const handleConnect = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: params.id
        })
      });

      if (!response.ok) throw new Error('Failed to send connection request');

      setConnectionStatus({ status: 'pending', initiator: user.uid });
      showToastMessage('Connection request sent!', 'success');
    } catch (error) {
      console.error('Error sending connection request:', error);
      showToastMessage('Failed to send request', 'error');
    }
  };

  const handleAccept = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/connections/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromUserId: params.id
        })
      });

      if (!response.ok) throw new Error('Failed to accept connection');

      setConnectionStatus({ status: 'accepted' });
      showToastMessage('Connection accepted!', 'success');
    } catch (error) {
      console.error('Error accepting connection:', error);
      showToastMessage('Failed to accept connection', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/connections/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otherUserId: params.id
        })
      });

      if (!response.ok) throw new Error('Failed to disconnect');

      setConnectionStatus({ status: 'none' });
      showToastMessage('Disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting:', error);
      showToastMessage('Failed to disconnect', 'error');
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brown-600">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Profile not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <main className={styles.main}>
        <div className={styles.card}>
          <button
            onClick={() => router.push('/discovery')}
            className={styles.backButton}
          >
            ← Back to Discovery
          </button>

          <h1 className={styles.name}>{profile.name}</h1>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Gender</h2>
            <p className={styles.sectionContent}>{profile.gender}</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Interests</h2>
            <div className={styles.interests}>
              {profile.interests.map((interest) => (
                <span key={interest} className={styles.interest}>
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {connectionStatus.status === 'none' && (
            <button
              onClick={handleConnect}
              className={styles.connectButton}
            >
              Connect
            </button>
          )}

          {connectionStatus.status === 'pending' && (
            <div className={styles.pendingSection}>
              {connectionStatus.initiator === auth.currentUser?.uid ? (
                <p className={styles.pendingText}>Connection request sent</p>
              ) : (
                <div className={styles.pendingActions}>
                  <p className={styles.pendingText}>Connection request received</p>
                  <button
                    onClick={handleAccept}
                    className={styles.acceptButton}
                  >
                    Accept
                  </button>
                </div>
              )}
            </div>
          )}

          {connectionStatus.status === 'accepted' && (
            <div className={styles.connectedSection}>
              <div className={styles.connectedActions}>
                <button
                  onClick={() => router.push(`/chat/${params.id}`)}
                  className={styles.chatButton}
                >
                  Chat
                </button>
                <button
                  onClick={handleDisconnect}
                  className={styles.disconnectButton}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showToast && (
        <div className={`${styles.toast} ${styles[`toast${toastType}`]}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
} 