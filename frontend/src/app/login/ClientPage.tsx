'use client';

import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false
});

export default function ClientPage() {
  return (
    <DynamicPageWrapper>
      <LoginContent />
    </DynamicPageWrapper>
  );
} 