'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Notifications from './Notifications';

export default function ClientNotifications() {
  // Only render on client side
  if (typeof window === 'undefined') return null;

  const portalElement = document.getElementById('notifications-portal');
  if (!portalElement) return null;

  return createPortal(
    <Notifications />,
    portalElement
  );
} 