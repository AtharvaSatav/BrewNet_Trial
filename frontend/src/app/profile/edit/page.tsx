import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const EditProfileContent = dynamic(() => import('./EditProfileContent'), {
  ssr: false
});

export default function EditProfilePage() {
  return (
    <DynamicPageWrapper>
      <EditProfileContent />
    </DynamicPageWrapper>
  );
} 