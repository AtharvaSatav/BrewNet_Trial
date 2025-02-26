import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ProfileViewContent = dynamic(() => import('./ProfileViewContent'), {
  ssr: false
});

export default function ProfileViewPage() {
  return (
    <DynamicPageWrapper>
      <ProfileViewContent />
    </DynamicPageWrapper>
  );
} 