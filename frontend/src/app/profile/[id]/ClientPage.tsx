'use client';

import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ProfileViewContent = dynamic(() => import('./ProfileViewContent'), {
  ssr: false
});

export default function ClientPage() {
  return (
    <DynamicPageWrapper>
      <ProfileViewContent />
    </DynamicPageWrapper>
  );
} 