"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from '@/config/constants';

interface UserProfile {
  name: string;
  gender: string;
  interests: string[];
  intent: string;
}

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user/${user.uid}`);
        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        setProfile({
          name: data.user.name,
          gender: data.user.gender,
          interests: data.user.interests,
          intent: data.user.intent,
        });
      } catch (err) {
        setError("Failed to load profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

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
        <div className="text-red-600">{error || "Profile not found"}</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-brown-100 to-brown-200 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6 gap-4">
            <button
              onClick={() => router.push("/discovery")}
              className="px-4 py-2 text-brown-600 hover:text-brown-800 flex items-center gap-2"
            >
              <span>←</span> Back to Discovery
            </button>
            <h1 className="text-2xl font-bold text-brown-900">My Profile</h1>
            <button
              onClick={() => router.push("/onboarding?update=true")}
              className="px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-brown-700">Name</h2>
              <p className="mt-1 text-lg text-brown-900">{profile.name}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-brown-700">Gender</h2>
              <p className="mt-1 text-lg text-brown-900">{profile.gender}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-brown-700">Currently Looking For</h2>
              <p className="mt-1 text-lg text-brown-900 italic">
                "{profile.intent || "No intent set"}"
              </p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-brown-700">Interests</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-brown-100 text-brown-800 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
