"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import styles from "./page.module.css";
import { API_BASE_URL } from '@/config/constants';

interface OnboardingData {
  name: string;
  //gender: "male" | "female" | "Prefer not to say" | "";
  interests: string[];
  bio?: string;
}

const INTERESTS = [
  "Startups",
  "Consultancy",
  "AI",
  "Networking",
  "Sales & Marketing",
  "Creative Work",
  "Technology & Innovation",
  "Web3",
  "Product & Market",
  "Trading",
  "Lawyer",
  "Business Advisor",
  "HR",
];

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Now inside Suspense
  const isUpdate = searchParams.get("update") === "true";
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    //gender: "",
    interests: [],
    bio: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push("/login");
          return;
        }

        if (isUpdate) {
          const response = await fetch(`${API_BASE_URL}/api/auth/check-user/${user.uid}`);
          if (response.ok) {
            const profile = await response.json();
            setData({
              name: profile.name || "",
              //gender: profile.gender || "",
              interests: profile.interests || [],
              bio: profile.bio || "",
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isUpdate, router]);

  const handleNext = async () => {
    const isStepValid = () => {
      if (step === 1) return data.name.trim().length > 0;
      //if (step === 2) return data.gender !== "";
      if (step === 2) return data.interests.length > 0;
      if (step === 3) return true;  // Bio is optional, so always valid
      return false;
    };

    if (!isStepValid()) {
      return;
    }

    if (step === 3) {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push("/login");
          return;
        }

        console.log("Sending data:", data);

        const endpoint = isUpdate ? "update-profile" : "complete-onboarding";
        const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: user.uid,
            ...data,
          }),
        });

        const responseData = await response.json();
        console.log("Response:", responseData);

        if (response.ok) {
          router.push("/discovery");
        }
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay} />
      <div className={styles.card}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.brandSection}>
          <h1 className={styles.title}>
            {isUpdate ? "Update Your Profile" : "Complete Your Profile"}
          </h1>
        </div>

        <div className={styles.progressBar}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${styles.progressStep} ${
                i <= step ? styles.progressStepActive : ""
              }`}
            />
          ))}
        </div>

        <div className={styles.stepCounter}>Step {step} of 3</div>

        {step === 1 && (
          <div className={styles.formGroup}>
            <h2 className={styles.title}>What's your name?</h2>
            <input
              type="text"
              className={styles.input}
              placeholder="Enter your name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>
        )}

        {/* {step === 2 && (
          <div className={styles.formGroup}>
            <h2 className={styles.title}>Select your gender</h2>
            <div className={styles.genderGrid}>
              {["male", "female", "Prefer not to say"].map((gender) => (
                <button
                  key={gender}
                  className={`${styles.genderButton} ${
                    data.gender === gender ? styles.genderButtonActive : ""
                  }`}
                  onClick={() =>
                    setData({
                      ...data,
                      gender: gender as OnboardingData["gender"],
                    })
                  }
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )} */}

        {step === 2 && (
          <div className={styles.formGroup}>
            <h2 className={styles.title}>Select your interests</h2>
            <div className={styles.interestsContainer}>
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  className={`${styles.interestButton} ${
                    data.interests.includes(interest)
                      ? styles.interestButtonActive
                      : ""
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.formGroup}>
            <h2 className={styles.title}>Tell us a little about yourself! Just a sentence or two (optional)</h2>
            <textarea
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="Write a brief introduction..."
              className={styles.textarea}
              rows={3}
            />
          </div>
        )}

        <div className={styles.navigation}>
          {step > 1 && (
            <button onClick={handleBack} className={styles.backButton}>
              ← Back
            </button>
          )}
          <button onClick={handleNext} className={styles.nextButton}>
            {step === 3 ? "Finish" : "Next"} →
          </button>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="text-white text-center">Loading...</div>;
}
