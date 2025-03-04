'use client';

import { useEffect } from 'react';
import styles from './LinkedIn.module.css';

interface LinkedInProps {
  clientId: string;
  scope: string[];
  callback: (error: string | null, code: string | null, redirectUri: string | null) => void;
  className?: string;
}

const LinkedIn: React.FC<LinkedInProps> = ({ clientId, scope, callback, className }) => {
  useEffect(() => {
    handleRedirect();
  }, []);

  const handleRedirect = () => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = localStorage.getItem('linkedInRedirectUri');
    const savedState = localStorage.getItem('linkedInState');

    localStorage.removeItem('linkedInState');
    localStorage.removeItem('linkedInRedirectUri');

    const state = urlParams.get('state');
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    // Clear URL parameters after handling
    let newURL = window.location.pathname;
    urlParams.delete('state');
    urlParams.delete('error');
    urlParams.delete('error_description');
    urlParams.delete('code');
    if (urlParams.toString()) {
      newURL = `${newURL}?${urlParams.toString()}`;
    }
    window.history.replaceState(null, '', newURL);

    if (error) {
      callback(error, null, null);
    } else if (redirectUri && code && savedState === state) {
      callback(null, code, redirectUri);
    }
  };

  const startLogin = () => {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('linkedInState', state);
    localStorage.setItem('linkedInRedirectUri', window.location.href);

    const loginUrl = getURL(clientId, state, scope);
    window.location.href = loginUrl;
  };

  return (
    <button 
      className={`${styles.linkedinButton} ${className}`} 
      onClick={startLogin}
    >
      <i className="fab fa-linkedin"></i> Sign in with LinkedIn
    </button>
  );
};

const getURL = (clientId: string, state: string, scope: string[]) => {
  // Use the same redirect URI as registered in LinkedIn
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_FRONTEND_URL + '/discovery');
  const base = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&';
  const fullScope = scope?.length ? `&scope=${encodeURIComponent(scope.join(' '))}` : '';

  return `${base}client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}${fullScope}`;
};

export default LinkedIn; 