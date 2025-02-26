'use client';

import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const EditProfileContent = dynamic(() => import('./EditProfileContent'), {
  ssr: false
});

export default function ClientPage() {
  return (
    <DynamicPageWrapper>
      <EditProfileContent />
    </DynamicPageWrapper>
  );
} 