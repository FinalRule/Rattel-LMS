import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = LoginData & {
  fullName: string;
  role: "admin" | "teacher" | "student";
};

type User = {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
};

type AuthError = {
  message: string;
  code?: string;
};

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: user, error, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: LoginData) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setAuthError(data.error || 'Login failed');
        throw new Error(data.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      setAuthError(null);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      setAuthError(null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setAuthError(data.error || 'Registration failed');
        throw new Error(data.error || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data.user);
      setAuthError(null);
      toast({
        title: "Success",
        description: "Registration successful",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearAuthError = () => setAuthError(null);

  return {
    user,
    isLoading,
    error,
    authError,
    clearAuthError,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(await response.text());
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}