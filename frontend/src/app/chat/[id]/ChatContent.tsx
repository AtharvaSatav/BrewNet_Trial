'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Message } from '@/types/message';
import styles from './page.module.css';

interface ChatUser {
  firebaseUid: string;
  name: string;
}

export default function ChatContent() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        
        // Fetch other user's profile
        const userResponse = await fetch(`http://localhost:5000/api/users/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();
        setOtherUser({
          firebaseUid: userData.user.firebaseUid,
          name: userData.user.name
        });

        // Fetch chat history
        const chatResponse = await fetch(
          `http://localhost:5000/api/chat/history/${user.uid}/${params.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!chatResponse.ok) throw new Error('Failed to fetch chat history');
        const chatData = await chatResponse.json();
        setMessages(chatData.messages);
      } catch (err) {
        setError('Failed to load chat');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [params.id, router]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: params.id,
          text: newMessage
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages([...messages, data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brown-600">Loading chat...</div>
      </div>
    );
  }

  if (error || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Chat not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <header className={styles.header}>
        <button
          onClick={() => router.push(`/profile/${params.id}`)}
          className={styles.backButton}
        >
          ← Back to Profile
        </button>
        <h1 className={styles.chatWith}>Chat with {otherUser.name}</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.messages}>
          {messages.map((message) => (
            <div
              key={message._id}
              className={`${styles.message} ${
                message.senderId === auth.currentUser?.uid ? styles.sent : styles.received
              }`}
            >
              <div className={styles.messageContent}>
                {message.text}
              </div>
              <div className={styles.messageTime}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.input}
          />
          <button 
            onClick={handleSend}
            className={styles.sendButton}
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
} 