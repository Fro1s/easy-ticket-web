'use client';

import * as React from 'react';

const ACCESS_KEY = 'easy_access_token';
const REFRESH_KEY = 'easy_refresh_token';
const USER_KEY = 'easy_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(payload: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  window.localStorage.setItem(ACCESS_KEY, payload.accessToken);
  window.localStorage.setItem(REFRESH_KEY, payload.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  window.dispatchEvent(new Event('easy:auth-changed'));
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('easy:auth-changed'));
}

export function useAuth() {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setUser(getStoredUser());
    setReady(true);

    const onChange = () => setUser(getStoredUser());
    window.addEventListener('easy:auth-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('easy:auth-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return { user, ready, signOut: clearSession };
}
