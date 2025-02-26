import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const ChatContent = dynamic(() => import('./ChatContent'), {
  ssr: false
});

export default function ChatPage() {
  return (
    <DynamicPageWrapper>
      <ChatContent />
    </DynamicPageWrapper>
  );
} 