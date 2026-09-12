export type UserRole = 'inspector' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeOrOrg: string;
  avatarUrl?: string;
  loggedInAt: string;
}
