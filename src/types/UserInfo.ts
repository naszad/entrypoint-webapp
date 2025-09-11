import { User } from "@/types/Models";

export interface UserInfo extends Omit<User, 'auth_user_id' | 'school_id'> {
  role?: string,
  isMultiSchoolUser?: boolean,
  schools?: {
    schoolId?: string,
    name?: string
  }[]
}