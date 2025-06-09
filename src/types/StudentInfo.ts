import { Student } from "@/models/Students";

export interface StudentInfo extends Student {
  photoUrl?: string;
}