'use client';

import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ChatContent = dynamic(() => import('./ChatContent'), {
  ssr: false
});

export default function ClientPage() {
  return (
    <DynamicPageWrapper>
      <ChatContent />
    </DynamicPageWrapper>
  );
} 