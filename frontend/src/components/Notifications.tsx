'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import styles from './Notifications.module.css';
import io from 'socket.io-client';
import { useRouter } from 'next/router';

interface Notification {
  _id: string;
  type: 'connection_request' | 'connection_accepted';
  fromUser: {
    name: string;
    firebaseUid: string;
  };
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Set up WebSocket connection
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      socket.emit('join', { userId: user.uid });
    });

    // Listen for new notifications
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/notifications/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await fetch(`http://localhost:5000/api/notifications/${notification._id}/read`, {
        method: 'PUT'
      });

      // Remove from list
      setNotifications(prev => prev.filter(n => n._id !== notification._id));

      // Navigate to profile if it's a connection request
      if (notification.type === 'connection_request') {
        router.push(`/profile/${notification.fromUser.firebaseUid}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={styles.notification}
          onClick={() => handleNotificationClick(notification)}
        >
          {notification.type === 'connection_request' && (
            <div className={styles.notificationContent}>
              <div className={styles.notificationTitle}>New Connection Request!</div>
              <div className={styles.notificationMessage}>
                {notification.fromUser.name} wants to connect with you
              </div>
              <div className={styles.notificationTime}>
                {new Date(notification.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          {notification.type === 'connection_accepted' && (
            <div className={styles.notificationContent}>
              <div className={styles.notificationTitle}>Connection Accepted! 🎉</div>
              <div className={styles.notificationMessage}>
                You are now connected with {notification.fromUser.name}
              </div>
              <div className={styles.notificationTime}>
                {new Date(notification.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 