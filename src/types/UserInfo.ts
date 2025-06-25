import { User } from "@/models/Users";

export interface UserInfo extends Omit<User, 'authUserId' | 'schoolId'> {
  role?: string,
  isMultiSchoolUser?: boolean,
  schools?: {
    schoolId?: string,
    name?: string
  }[]
}