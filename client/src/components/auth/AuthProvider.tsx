import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { SelectUser } from "@db/schema";

interface AuthContextType {
  user: SelectUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<SelectUser>;
  logout: () => Promise<void>;
  getAuthHeaders: () => { Authorization: string; "Content-Type": string } | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
