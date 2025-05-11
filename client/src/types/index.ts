import { User as BaseUser } from '@shared/schema';

// Extend the base user type with our additional profile fields
export interface ExtendedUser extends BaseUser {
  fullName: string | null;
  mobileNumber: string | null;
  accountNumber: string | null;
  accountIfsc: string | null;
  upiId: string | null;
  profilePhoto: string | null;
  telegramId: string | null;
}

// Re-export other types from schema except User
export type { Tournament, Quiz, Question, Participant, Payment, UserResponse } from '@shared/schema';

// Export our extended user type as User
export type User = ExtendedUser;
