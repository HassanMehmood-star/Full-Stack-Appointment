export interface User {
  id: number;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const API_BASE_URL = 'http://localhost:4000';

// Token management
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// API calls with authentication
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Authentication functions
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setToken(response.access_token);
  setUser(response.user);

  return response;
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<any> => {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logout = (): void => {
  removeToken();
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const hasRole = (requiredRole: string): boolean => {
  const user = getUser();
  return user?.role === requiredRole;
};

export const hasAnyRole = (roles: string[]): boolean => {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
}; 