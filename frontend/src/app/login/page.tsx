import dynamic from 'next/dynamic';
import DynamicPageWrapper from '@/components/DynamicPageWrapper';

const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false
});

export default function LoginPage() {
  return (
    <DynamicPageWrapper>
      <LoginContent />
    </DynamicPageWrapper>
  );
} 