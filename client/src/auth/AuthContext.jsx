import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const mockProfiles = {
  taxpayer: {
    id: 'usr-001',
    fullName: 'Amina Yusuf',
    email: 'amina.yusuf@example.com',
    phone: '08034567890',
    address: '14 Marina Road, Lagos',
    tin: 'TIN-2026-001248',
    role: 'taxpayer',
  },
  admin: {
    id: 'usr-900',
    fullName: 'Compliance Officer',
    email: 'admin@etax.test',
    phone: '08000000000',
    address: 'Revenue Service HQ',
    tin: 'ADMIN-0001',
    role: 'admin',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      loginAs(role, profile = {}) {
        setUser({ ...mockProfiles[role], ...profile, role });
      },
      logout() {
        setUser(null);
      },
    }),
    [user],
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
