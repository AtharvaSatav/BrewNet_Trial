"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import styles from "./Notifications.module.css";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '@/config/constants';

interface Notification {
  _id: string;
  type: "connection_request" | "connection_accepted" | "connection_removed";
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
    let intervalId: NodeJS.Timeout;

    const fetchNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/api/notifications/${user.uid}`);

        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Fetch initially
    fetchNotifications();

    // Poll every 1 second
    intervalId = setInterval(fetchNotifications, 5000);

    // Cleanup polling on unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await fetch(`${API_BASE_URL}/api/notifications/${notification._id}/read`, {
        method: "PUT",
      });

      // Remove from list
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notification._id)
      );

      // Navigate to profile if it's a connection request
      if (notification.type === "connection_request") {
        router.push(`/profile/${notification.fromUser.firebaseUid}`);
      }
      if (notification.type === "connection_removed") {
        router.push(`/discovery`);
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  const handleClose = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent notification click when clicking close button
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
    } catch (error) {
      console.error("Error closing notification:", error);
    }
  };

  // Only render if we have notifications
  if (notifications.length === 0) return null;

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={styles.notification}
          onClick={() => handleNotificationClick(notification)}
        >
          <button 
            className={styles.closeButton}
            onClick={(e) => handleClose(e, notification._id)}
          >
            ×
          </button>
          
          {notification.type === "connection_request" && (
            <div className={styles.notificationContent}>
              <div className={styles.notificationTitle}>
                New Connection Request!
              </div>
              <div className={styles.notificationMessage}>
                {notification.fromUser.name} wants to connect with you
              </div>
              <div className={styles.notificationTime}>
                {new Date(notification.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          {notification.type === "connection_accepted" && (
            <div className={styles.notificationContent}>
              <div className={styles.notificationTitle}>
                Connection Accepted! 🎉
              </div>
              <div className={styles.notificationMessage}>
                You are now connected with {notification.fromUser.name}, Go have
                a chat!
              </div>
              <div className={styles.notificationTime}>
                {new Date(notification.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )}
          {notification.type === "connection_removed" && (
            <div className={styles.notificationContent}>
              <div className={styles.notificationTitle}>
                Connection Removed!
              </div>
              <div className={styles.notificationMessage}>
                {notification.fromUser.name} Removed you
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
