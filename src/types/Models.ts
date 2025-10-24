import { MergeDeep } from "type-fest";
import {Database as DatabaseGenerated} from "@/types/db.types";

export type Database = MergeDeep<DatabaseGenerated, {
  public: {
    Tables: {
      courses: {
        Row: {
          updated_at: Date | null
          created_at: Date | null
        }
      },
      student_grades: {
        Row: {
          source_updated_date: Date | null
          updated_at: Date | null
          created_at: Date | null
        }
      },
      chats: {
        Row: {
          created_at: Date | null
          updated_at: Date | null
          deleted_at: Date | null
        }
      },
      chat_messages: {
        Row: {
          created_at: Date | null
          updated_at: Date | null
        }
      }
    }
  }
}>

export type Course = Database['public']['Tables']['courses']['Row']
export type StudentGrade = Database['public']['Tables']['student_grades']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type TermRow = Database['public']['Tables']['terms']['Row']