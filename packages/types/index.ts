export interface Application {
  id: string;
  name: string;
  description?: string;
  lifecycle_state: 'Planning' | 'Active' | 'Maintenance' | 'Retirement' | 'Retired';
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}
