'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DynamicPageWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
} 