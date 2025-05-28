import { School } from "@/models/Schools";
import { Student } from "@/models/Students";

export interface StudentInfo extends Student {
  school?: School;
}