'use client';

import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ProfileContent = dynamic(() => import('./ProfileContent'), {
  ssr: false
});

export default function ClientPage() {
  return (
    <DynamicPageWrapper>
      <ProfileContent />
    </DynamicPageWrapper>
  );
} 