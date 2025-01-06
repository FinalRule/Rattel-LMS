import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SelectUser } from "@db/schema";

interface AuthResponse {
  token: string;
  user: SelectUser;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    } : undefined;
  };

  const { data: user, isLoading, error } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const response = await fetch("/api/user", { headers });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          return null;
        }
        throw new Error("Failed to fetch user data");
      }

      return response.json();
    },
    retry: false,
    staleTime: Infinity
  });

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Login failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem("authToken", data.token);
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Logged in successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const logout = useMutation({
    mutationFn: async () => {
      const headers = getAuthHeaders();
      if (headers) {
        try {
          await fetch("/api/logout", {
            method: "POST",
            headers
          });
        } catch (error) {
          console.error("Logout request failed:", error);
        }
      }
      localStorage.removeItem("authToken");
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    }
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: login.mutateAsync,
    logout: logout.mutateAsync,
    getAuthHeaders
  };
}