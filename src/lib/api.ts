const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/fozo/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

// Cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();

// Function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Function to handle logout on token expiration
function handleTokenExpiration() {
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  // Redirect to login page directly instead of reloading
  window.location.href = '/login';
}

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
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestPromise = fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  }).then(async (response) => {
    // Handle token expiration - check for 401 or 403 with JWT expired message
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message?.toLowerCase() || '';
      
      if (errorMessage.includes('jwt expired') || 
          errorMessage.includes('expired') || 
          errorMessage.includes('invalid') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('verification failed')) {
        handleTokenExpiration();
        throw new Error('Token expired. Please login again.');
      }
    }
    
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
  getAllUsers: (userType?: 'customer' | 'restaurant' | 'delivery_partner' | 'admin', search?: string) => {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    if (search) params.append('search', search);
    return apiRequest<any[]>(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getAllRestaurants: (search?: string) => 
    apiRequest<any[]>(`/admin/restaurants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  // Onboard new restaurant (single transaction)
  onboardRestaurant: (body: {
    phoneNumber?: string;
    email?: string;
    password: string;
    fullName: string;
    userType: 'restaurant';
    restaurantName: string;
    contactPersonName?: string;
    fssaiLicenseNumber?: string;
    gstinNumber?: string;
    bankAccountDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
    primaryLocation: {
      locationName?: string;
      address: string;
      latitude: number;
      longitude: number;
      contactNumber?: string;
      email?: string;
    };
    operatingHours: Array<{
      dayOfWeek: string;
      openTime: string | null;
      closeTime: string | null;
      isClosed: boolean;
    }>;
  }) => apiRequest<{ message: string; restaurant_id: string; status: string }>(
    '/admin/restaurants',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  getAllOrders: (status?: string) => 
    apiRequest<{ orders: any[] }>(`/admin/orders${status ? `?status=${status}` : ''}`),
  getAllDeliveryPartners: () => apiRequest<any[]>('/admin/delivery-partners'),
  // Onboard new delivery partner (single transaction)
  // Note: Delivery partners use OTP-based auth, so email and password are optional
  onboardDeliveryPartner: (body: {
    phoneNumber: string; // Required - used for OTP authentication
    email?: string; // Optional
    password?: string; // Optional - DPs typically use OTP
    fullName: string;
    userType: 'delivery_partner';
    vehicleType: 'bicycle' | 'scooter' | 'motorcycle' | 'car';
    licenseNumber?: string;
    bankAccountDetails?: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
  }) => apiRequest<{ message: string; user_id: string; status: string }>(
    '/admin/delivery-partners',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  getAllSurpriseBags: () => apiRequest<any[]>('/admin/bags'),
  createSurpriseBag: (body: {
    targetRestaurantId: string; // admin creating for a specific restaurant
    bagName: string;
    denominationValue: number;
    actualWorth: number;
    description?: string;
    imageUrl?: string;
    quantityAvailable: number;
    pickupStartTime?: string; // HH:MM:SS
    pickupEndTime?: string;   // HH:MM:SS
    availableDate?: string;  // YYYY-MM-DD
    isActive?: boolean;
  }) => apiRequest<{ message: string; bag: any }>(
    '/bags',
    { method: 'POST', body: JSON.stringify(body) }
  ),
  // Auth/Registration
  registerPasswordUser: (body: {
    phoneNumber?: string;
    email?: string;
    password: string;
    userType: 'restaurant' | 'delivery_partner';
    fullName: string;
  }) => apiRequest<{ message: string; userId: string }>(
    '/auth/register-password',
    { method: 'POST', body: JSON.stringify(body), requireAuth: false }
  ),
  // Restaurant Admin Updates
  updateRestaurantProfile: (
    restaurantId: string,
    profileData: {
      restaurantName?: string;
      contactPersonName?: string;
      fssaiLicenseNumber?: string;
      gstinNumber?: string;
      bankAccountDetails?: any;
      primaryLocation?: any;
      operatingHours?: any[];
    }
  ) => apiRequest(`/admin/restaurants/${restaurantId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  updateRestaurantStatus: (
    restaurantId: string,
    status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed',
    documentsVerified?: boolean
  ) => apiRequest(`/admin/restaurants/${restaurantId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, documentsVerified }),
  }),
  // Delivery Partner Admin Updates
  updateDeliveryPartnerStatus: (
    dpUserId: string,
    status: 'pending' | 'approved' | 'rejected' | 'suspended',
    documentsVerified?: boolean
  ) => apiRequest(`/admin/delivery-partners/${dpUserId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, documentsVerified }),
  }),
};

