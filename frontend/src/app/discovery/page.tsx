import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const DiscoveryContent = dynamic(() => import('./DiscoveryContent'), {
  ssr: false
});

export default function DiscoveryPage() {
  return (
    <DynamicPageWrapper>
      <DiscoveryContent />
    </DynamicPageWrapper>
  );
} 