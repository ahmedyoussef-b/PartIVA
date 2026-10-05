import { create } from 'zustand';

export interface AuthUser {
  email: string;
  name: string;
  role: 'client' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const MOCK_USERS = [
  {
    email: 'admin@partiva.tn',
    password: 'admin123',
    name: 'Ingénieur Méthodes',
    role: 'admin' as const,
  },
  {
    email: 'atelier@partiva.tn',
    password: 'atelier123',
    name: 'Poste Atelier',
    role: 'admin' as const,
  },
  {
    email: 'm.bensalem@delice.tn',
    password: 'client123',
    name: 'M. Ben Salem',
    role: 'client' as const,
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, password: string) => {
    const matched = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!matched) return false;
    set({
      user: { email: matched.email, name: matched.name, role: matched.role },
      isAuthenticated: true,
    });
    return true;
  },
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));
