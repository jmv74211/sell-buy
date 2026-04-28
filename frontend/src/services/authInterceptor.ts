import { useAuthStore } from '@/store/auth';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const { token } = useAuthStore.getState();

    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newToken = data.access_token;

    // Update token in store
    useAuthStore.getState().setAuth(data.user, newToken);

    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    processQueue(error, null);

    // Clear auth on refresh failure
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';

    return null;
  } finally {
    isRefreshing = false;
  }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { token } = useAuthStore.getState();

  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401, try to refresh token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
}
