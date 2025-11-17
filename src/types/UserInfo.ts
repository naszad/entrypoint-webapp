import { User } from "@/types/Models";

export type Role = 'user' | 'admin';

export interface UserInfo extends Omit<User, 'auth_user_id' | 'school_id'> {
  role?: Role,
  isMultiSchoolUser?: boolean,
  updatedAt?: Date,
  schools?: {
    schoolId?: string,
    name?: string,
    customerId?: string,
    customerName?: string
  }[]
}
