import type { User, Institution } from './auth';

export interface License {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  max_users: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  license_id: string;
  institution_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  // 관계 데이터
  user?: User;
  license?: License;
  institution?: Institution;
}

export interface SubscriptionRequest {
  license_id: string;
  institution_id: string;
  start_date: string;
}