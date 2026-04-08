import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User } from "../types";
import { authAPI } from "../utils/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
      }
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      const { token, refreshToken, ...userData } = response.data.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData as User);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      passwordConfirm: string,
    ): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await authAPI.register({ username, email, password, passwordConfirm });
        const { token, refreshToken, ...userData } = response.data.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData as User);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async (credential: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.googleLogin(credential);
      const { token, refreshToken, ...userData } = response.data.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData as User);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      setUser(null);
    }
  }, []);

  const updateUserData = useCallback((updated: Partial<User>): void => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updated };
      localStorage.setItem("userData", JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
