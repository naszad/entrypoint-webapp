import { School } from "@/models/Schools";
import { User } from "@/models/Users";

export interface UserInfo extends Omit<User, 'authUserId' | 'schoolId'> {
  role?: string,
  school: Omit<School, 'schoolId'>;
}