import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ProfileContent = dynamic(() => import('./ProfileContent'), {
  ssr: false
});

export default function ProfilePage() {
  return (
    <DynamicPageWrapper>
      <ProfileContent />
    </DynamicPageWrapper>
  );
} 