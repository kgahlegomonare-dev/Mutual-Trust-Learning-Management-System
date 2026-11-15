export type UserRole = 'Admin' | 'Center Manager' | 'Teacher' | 'Manager' | 'Learner';

export interface User {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: UserRole;
  center_id: number | null;
  is_profile_claimed: boolean; 
}

export interface AuthResponse {
  token: string;
  user: User;
}