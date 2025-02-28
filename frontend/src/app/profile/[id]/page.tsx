"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

interface ConnectionStatus {
  status: "none" | "pending" | "accepted";
  initiator?: string;
}

interface Profile {
  firebaseUid: string;
  name: string;
  interests: string[];
  gender: string;
}

// Helper function to get connection status from localStorage
const getStoredConnectionStatus = (profileId: string) => {
  if (typeof window !== "undefined") {
    const connections = JSON.parse(localStorage.getItem("connections") || "{}");
    return connections[profileId] || "none";
  }
  return "none";
};

// Helper function to store connection status
const storeConnectionStatus = (profileId: string, status: string) => {
  if (typeof window !== "undefined") {
    const connections = JSON.parse(localStorage.getItem("connections") || "{}");
    connections[profileId] = status;
    localStorage.setItem("connections", JSON.stringify(connections));
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "none",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"info" | "success">("info");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndConnection = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Check if backend is available
        try {
          const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
          if (!healthCheck.ok) {
            throw new Error("Backend server not available");
          }
        } catch (error) {
          console.error("Backend health check failed:", error);
          setError("Server connection failed. Please try again later.");
          setLoading(false);
          return;
        }

        // Fetch profile data with error handling
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/api/auth/user/${params.id}`);
          if (!profileResponse.ok) {
            throw new Error(
              `Failed to fetch profile: ${profileResponse.statusText}`
            );
          }
          const profileData = await profileResponse.json();
          setProfile(profileData.user);

          // Fetch connection status
          const connectionResponse = await fetch(
            `${API_BASE_URL}/api/connections/status/${currentUser.uid}/${params.id}`
          );
          if (!connectionResponse.ok) {
            throw new Error(
              `Failed to fetch connection status: ${connectionResponse.statusText}`
            );
          }
          const connectionData = await connectionResponse.json();
          setConnectionStatus(connectionData);
        } catch (error) {
          console.error("Data fetching error:", error);
          setError(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred"
          );
        }

        setLoading(false);
      } catch (error) {
        console.error("General error:", error);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    };

    fetchProfileAndConnection();
  }, [params.id, router]);

  const handleConnect = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/connections/request`,
        {
          //const response = await fetch('http://192.168.1.3:5000/api/connections/request', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromUserId: currentUser.uid,
            toUserId: params.id,
          }),
        }
      );

      // if (!response.ok) throw new Error("Failed to send connection request");

      const data = await response.json();
      setConnectionStatus({ status: "pending", initiator: currentUser.uid });

      setToastMessage("Connection request sent!");
      setToastType("info");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to send connection request");
    }
  };

  const handleAcceptConnection = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/connections/accept`,
        {
          //const response = await fetch('http://192.168.1.3:5000/api/connections/accept', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromUserId: connectionStatus.initiator,
            toUserId: currentUser.uid,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to accept connection");

      setConnectionStatus({ status: "accepted" });
      setToastMessage("Connection accepted!");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to accept connection");
    }
  };

  const handleDisconnect = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/connections/${currentUser.uid}/${params.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to disconnect");

      setConnectionStatus({ status: "none" });
      setToastMessage("Disconnected successfully");
      setToastType("info");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay} />
        <div className="text-white text-center">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay} />
        <div className="text-white text-center">Profile not found</div>
      </div>
    );
  }

  const isOwnProfile = auth.currentUser?.uid === params.id;

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />

      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
      </header>

      <main className={styles.profileCard}>
        <h1 className={styles.name}>{profile.name}</h1>

        <div className={styles.interestsContainer}>
          {profile.interests.map((interest) => (
            <span key={interest} className={styles.interest}>
              {interest}
            </span>
          ))}
        </div>

        {!isOwnProfile && (
          <>
            {connectionStatus.status === "none" && (
              <button onClick={handleConnect} className={styles.connectButton}>
                Connect
              </button>
            )}

            {connectionStatus.status === "pending" &&
              connectionStatus.initiator === auth.currentUser?.uid && (
                <div className={styles.statusPending}>
                  Connection Request Pending
                </div>
              )}

            {connectionStatus.status === "pending" &&
              connectionStatus.initiator !== auth.currentUser?.uid && (
                <button
                  onClick={handleAcceptConnection}
                  className={`${styles.button} ${styles.acceptButton}`}
                >
                  Accept Connection
                </button>
              )}

            {connectionStatus.status === "accepted" && (
              <div className={styles.connectionActions}>
                <div className={styles.statusConnected}>Connected</div>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => router.push(`/chat/${profile.firebaseUid}`)}
                    className={styles.chatButton}
                  >
                    Start Chat
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
          </>
        )}
      </main>

      {showToast && (
        <div className={`${styles.toast} ${styles[`toast${toastType}`]}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
