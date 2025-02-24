'use client';

import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 
            onClick={() => router.push('/discovery')}
            className="text-2xl font-bold text-brown-900 cursor-pointer"
          >
            BrewNet
          </h1>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
            >
              My Profile
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/profile');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-brown-50"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/profile/edit');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-brown-50"
                >
                  Edit Profile
                </button>
                <button
                  onClick={async () => {
                    await auth.signOut();
                    router.push('/login');
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-brown-50 text-red-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 