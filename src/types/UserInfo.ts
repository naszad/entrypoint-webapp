import { User } from "@/models/Users";

export interface UserInfo extends Omit<User, 'authUserId' | 'schoolId'> {
  role?: string,
  school?: {
    schoolId?: string,
    name?: string
  }
}