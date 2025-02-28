"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { AVAILABLE_INTERESTS } from "@/types/onboarding";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from '@/config/constants';

interface UserProfile {
  name: string;
  gender: string;
  interests: string[];
}

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    gender: "",
    interests: [],
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      console.log("Sending profile update:", profile);

      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile/${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const data = await response.json();
      console.log("Update response:", data);

      router.push("/profile");
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brown-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-brown-100 to-brown-200 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push("/discovery")}
              className="text-brown-600 hover:text-brown-800 flex items-center gap-2"
            >
              <span>←</span> Back to Discovery
            </button>
            <h1 className="text-2xl font-bold text-brown-900">Edit Profile</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-brown-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-brown-700"
              >
                Gender
              </label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, gender: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brown-700 mb-2">
                Interests
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-brown-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={profile.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="rounded text-brown-600 focus:ring-brown-500"
                    />
                    <span className="text-sm text-brown-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-brown-600 text-brown-600 rounded-lg hover:bg-brown-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
