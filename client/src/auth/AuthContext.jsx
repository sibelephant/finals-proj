import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
export const STORAGE_KEY = 'etax_session';

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { user: session.user ?? null, token: session.token ?? null };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, token: null };
    }
  });

  const value = useMemo(
    () => ({
      user: sessionState.user,
      token: sessionState.token,
      role: sessionState.user?.role ?? null,
      setSession(session) {
        setSessionState({ user: session.user, token: session.token });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      },
      logout() {
        setSessionState({ user: null, token: null });
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [sessionState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
