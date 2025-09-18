import { User } from "@/types/Models";

export interface UserInfo extends Omit<User, 'auth_user_id' | 'school_id'> {
  role?: 'user' | 'admin',
  isMultiSchoolUser?: boolean,
  updatedAt?: Date,
  schools?: {
    schoolId?: string,
    name?: string
  }[]
}