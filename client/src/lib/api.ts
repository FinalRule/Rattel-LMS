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
            window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
          }

          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
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

export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || response.statusText);
  }

  return response.json();
}
