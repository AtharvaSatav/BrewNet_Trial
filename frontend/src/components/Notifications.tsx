'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface Notification {
  _id: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_removed';
  fromUser: string;
  read: boolean;
  createdAt: Date;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = auth.currentUser;
    if (!user) return;

    // Initial fetch
    fetchNotifications(user.uid);

    // Poll for new notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications(user.uid);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notifications:', data.notifications);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500 animate-slideIn"
          onClick={() => markAsRead(notification._id)}
        >
          {notification.type === 'connection_accepted' && (
            <div className="flex flex-col">
              <p className="text-green-600 font-semibold">
                Connection Request Accepted! 🎉
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Your connection request was accepted
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Click to dismiss
              </p>
            </div>
          )}
          {notification.type === 'connection_removed' && (
            <div className="flex flex-col">
              <p className="text-red-600 font-semibold">
                Connection Removed
              </p>
              <p className="text-sm text-gray-600 mt-1">
                A user has disconnected from you
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Click to dismiss
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 