import { QueryClient } from "@tanstack/react-query";

const getToken = () => localStorage.getItem('ACCESS_TOKEN');

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = getToken();
        const res = await fetch(queryKey[0] as string, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('ACCESS_TOKEN');
            throw new Error('Authentication required');
          }

          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          const errorText = await res.text();
          throw new Error(errorText);
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});