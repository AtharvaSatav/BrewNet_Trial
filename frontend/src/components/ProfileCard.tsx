import { Profile } from '@/types/profile';
import { useRouter } from 'next/navigation';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/profile/${profile.firebaseUid}`)}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <h2 className="text-xl font-semibold text-brown-900 mb-4">{profile.name}</h2>
      
      {profile.intent && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-brown-700">Looking for</h3>
          <p className="text-brown-600 italic">"{profile.intent}"</p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-brown-700">Interests</h3>
        <div className="flex flex-wrap gap-2">
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
  );
} 