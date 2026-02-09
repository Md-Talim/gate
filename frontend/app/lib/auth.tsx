import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "~/lib/api";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiFetch<{ token: string }>("/api/auth/public/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    localStorage.setItem("token", data.token);
    setToken(data.token);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    await apiFetch<string>("/api/auth/public/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isAuthenticating: isAuthenticating,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
