import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
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

  const { data: user, isLoading, error } = useQuery<User>({
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
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch user data");
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem("authToken", data.token);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
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