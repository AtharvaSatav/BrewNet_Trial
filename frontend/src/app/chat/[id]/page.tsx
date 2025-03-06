"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import { signOut } from "firebase/auth";
import { API_BASE_URL } from '@/config/constants';

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ChatUser {
  firebaseUid: string;
  name: string;
}

// Helper function to get chat ID
const getChatId = (userId1: string, userId2: string) => {
  // Sort IDs to ensure consistent chat ID regardless of who initiates
  return [userId1, userId2].sort().join("_");
};

// Helper function to get stored messages
const getStoredMessages = (chatId: string): Message[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(`chat_${chatId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
};

// Helper function to store messages
const storeMessages = (chatId: string, messages: Message[]) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
  } catch (error) {
    console.error("Error storing messages:", error);
  }
};

// Add this constant for quick messages
const QUICK_MESSAGES = [
  "Which table are you at?",
  "Can we meet in person?",
  "Would you like to get coffee together?",
  "Are you currently at the cafe?",
];

export default function ChatRoom() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatId, setChatId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat and load messages
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const otherUserId = params.id as string;
    const uniqueChatId = getChatId(currentUser.uid, otherUserId);
    setChatId(uniqueChatId);

    // Load stored messages
    const storedMessages = getStoredMessages(uniqueChatId);
    setMessages(storedMessages);
  }, [params.id, router]);

  // Store messages whenever they change
  useEffect(() => {
    if (chatId && messages.length > 0) {
      storeMessages(chatId, messages);
    }
  }, [messages, chatId]);
  useEffect(() => {
    let intervalId: any;

    const fetchUserAndMessages = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Fetch other user's details
        const userResponse = await fetch(
          `${API_BASE_URL}/api/auth/user/${params.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user details");
        }

        const userData = await userResponse.json();
        setOtherUser(userData.user);

        // Fetch chat history
        const chatResponse = await fetch(
          `${API_BASE_URL}/api/chat/history/${currentUser.uid}/${params.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!chatResponse.ok) {
          throw new Error("Failed to fetch chat history");
        }

        const chatData = await chatResponse.json();
        setMessages(chatData.messages);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load chat"
        );
        setLoading(false);
      }
    };

    // Fetch initially
    fetchUserAndMessages();

    // Polling every 1 second
    intervalId = setInterval(async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const chatResponse = await fetch(
          `${API_BASE_URL}/api/chat/history/${currentUser.uid}/${params.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!chatResponse.ok) {
          throw new Error("Failed to fetch chat history");
        }

        const chatData = await chatResponse.json();
        setMessages(chatData.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [params.id, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: currentUser.uid,
          receiverId: params.id,
          text: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Add message to local state immediately
      const timestamp = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          senderId: currentUser.uid,
          text: newMessage.trim(),
          timestamp,
        },
      ]);

      // Clear input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error to user
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSignOut = async () => {
    try {
      // Get the current user's ID before signing out
      const userId = auth.currentUser?.uid;

      if (!userId) return;

      // Update user's status in database
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sign-out status");
      }

      // Sign out from Firebase
      await signOut(auth);

      // Clear local storage for this user
      localStorage.clear();

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleQuickMessage = async (message: string) => {
    if (!auth.currentUser) return;

    try {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        senderId: auth.currentUser.uid,
        receiverId: params.id,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newMessage]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) throw new Error("Failed to send message");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  };

  useEffect(() => {
    const markMessagesAsRead = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      try {
        await fetch(`${API_BASE_URL}/api/chat/read/${params.id}/${currentUser.uid}`, {
          method: 'PUT'
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    if (params.id && auth.currentUser) {
      markMessagesAsRead();
    }
  }, [params.id, auth.currentUser]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.overlay} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />

      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <div className={styles.brandName}>BrewNet</div>
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
                onClick={() => router.push(`/profile/${auth.currentUser?.uid}`)}
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
      </header>

      <main className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h1 className={styles.userName}>{otherUser?.name}</h1>
        </div>

        <div className={styles.messageList}>
          {messages.map((message) => (
            <div
              key={message._id || `${message.senderId}-${message.timestamp}`}
              className={`${styles.messageWrapper} ${
                message.senderId === auth.currentUser?.uid
                  ? styles.sent
                  : styles.received
              }`}
            >
              <div className={styles.message}>
                {message.text}
                <span className={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.quickMessages}>
          {QUICK_MESSAGES.map((message) => (
            <button
              key={message}
              onClick={() => handleQuickMessage(message)}
              className={styles.quickMessageButton}
            >
              {message}
            </button>
          ))}
        </div>

        <div className={styles.inputArea}>
          <form onSubmit={handleSend} className={styles.messageForm}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.input}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={styles.sendButton}
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
