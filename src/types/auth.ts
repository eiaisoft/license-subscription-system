export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  institution_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  domain: string;
  contact_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean; // isLoading에서 loading으로 변경
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  institution_id: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}