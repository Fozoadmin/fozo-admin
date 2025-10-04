const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/fozo/api';
const API_KEY = 'srxdtcfy14Eguy5212hijbswd7iobhvinoqhd78gq2r74oh809h9TFR76GDH83csyHQ9DH3H8EH9Q';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// Cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  // Create cache key
  const cacheKey = `${endpoint}-${JSON.stringify(fetchOptions.body || {})}`;
  
  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...fetchOptions.headers,
  };

  if (requireAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestPromise = fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }).finally(() => {
    // Remove from cache after completion
    requestCache.delete(cacheKey);
  });

  // Store the promise in cache
  requestCache.set(cacheKey, requestPromise);
  
  return requestPromise;
}

// Admin API methods
export const adminApi = {
  getAllUsers: () => apiRequest<any[]>('/admin/users'),
  getAllRestaurants: () => apiRequest<any[]>('/admin/restaurants'),
  getAllOrders: (status?: string) => 
    apiRequest<{ orders: any[] }>(`/admin/orders${status ? `?status=${status}` : ''}`),
  getAllDeliveryPartners: () => apiRequest<any[]>('/admin/delivery-partners'),
  getAllSurpriseBags: () => apiRequest<any[]>('/admin/bags'),
};

