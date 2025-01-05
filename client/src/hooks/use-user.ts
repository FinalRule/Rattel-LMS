import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

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

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: user, error, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/user');
      } catch (error) {
        if ((error as Error).message.includes('401')) {
          return null;
        }
        throw error;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: LoginData) => {
      try {
        const data = await apiRequest('/api/login', {
          method: 'POST',
          body: JSON.stringify(userData),
        });

        // Store the token
        if (data.token) {
          localStorage.setItem('ACCESS_TOKEN', data.token);
        }

        return data;
      } catch (error) {
        setAuthError((error as Error).message);
        throw error;
      }
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
      await apiRequest('/api/logout', { method: 'POST' });
      localStorage.removeItem('ACCESS_TOKEN');
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
      try {
        const data = await apiRequest('/api/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });

        // Store the token if provided with registration
        if (data.token) {
          localStorage.setItem('ACCESS_TOKEN', data.token);
        }

        return data;
      } catch (error) {
        setAuthError((error as Error).message);
        throw error;
      }
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