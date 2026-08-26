import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';

const TOKEN_KEY = 'portfolio_admin_token';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
}

interface AdminAuthValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  /** True while the stored token is being revalidated on first mount. */
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-mode browsers can throw on access; treat as signed out.
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — session stays in memory only */
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const logout = useCallback(() => {
    writeStoredToken(null);
    setUser(null);
  }, []);

  /**
   * A token in localStorage is not proof of a valid session — it may be
   * expired or the account deactivated. Verify against /auth/me before
   * treating the user as signed in.
   */
  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setIsRestoring(false);
      return;
    }

    let active = true;
    apiClient
      .get<AdminUser>('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) writeStoredToken(null);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await apiClient.post<{
        accessToken: string;
        user: AdminUser;
      }>('/auth/login', { email, password });

      writeStoredToken(data.accessToken);
      setUser(data.user);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Sign in failed.'));
    }
  }, []);

  // Any 401 from the API means the session is over — drop it everywhere.
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401 && readStoredToken()) {
          logout();
        }
        return Promise.reject(error);
      },
    );
    return () => apiClient.interceptors.response.eject(interceptor);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isRestoring,
      login,
      logout,
    }),
    [user, isRestoring, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside an AdminAuthProvider.');
  }
  return context;
}
