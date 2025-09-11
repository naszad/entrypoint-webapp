export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          course_id: string
          created_at: string | null
          customer_id: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          local_course_code: string | null
          name: string | null
          school_id: string
          state_course_code: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string
          created_at?: string | null
          customer_id?: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          local_course_code?: string | null
          name?: string | null
          school_id: string
          state_course_code?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          customer_id?: string | null
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          local_course_code?: string | null
          name?: string | null
          school_id?: string
          state_course_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "courses_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          customer_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          created_at: string | null
          created_by: Database["public"]["Enums"]["created_by"]
          meeting_note_id: string
          notes: string | null
          private: boolean
          student_id: string
          summary: string | null
          transcript: string | null
          update_log: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: Database["public"]["Enums"]["created_by"]
          meeting_note_id?: string
          notes?: string | null
          private?: boolean
          student_id: string
          summary?: string | null
          transcript?: string | null
          update_log?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: Database["public"]["Enums"]["created_by"]
          meeting_note_id?: string
          notes?: string | null
          private?: boolean
          student_id?: string
          summary?: string | null
          transcript?: string | null
          update_log?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "meeting_notes_user_id_users_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          name: string
          page_name: string | null
          params: string | null
          report_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          name: string
          page_name?: string | null
          params?: string | null
          report_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          name?: string
          page_name?: string | null
          params?: string | null
          report_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_users_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      school_student_link: {
        Row: {
          created_at: string | null
          end_date: string | null
          school_id: string
          start_date: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          school_id: string
          start_date?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          school_id?: string
          start_date?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_student_link_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "school_student_link_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          assistant_principal_email: string | null
          assistant_principal_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_id: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          gpa_config: Json | null
          name: string
          phone: string | null
          principal_email: string | null
          principal_name: string | null
          school_id: string
          school_number: number | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assistant_principal_email?: string | null
          assistant_principal_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          gpa_config?: Json | null
          name: string
          phone?: string | null
          principal_email?: string | null
          principal_name?: string | null
          school_id?: string
          school_number?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assistant_principal_email?: string | null
          assistant_principal_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          gpa_config?: Json | null
          name?: string
          phone?: string | null
          principal_email?: string | null
          principal_name?: string | null
          school_id?: string
          school_number?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      section_enrollments: {
        Row: {
          absences: number
          created_at: string | null
          customer_id: string | null
          end_date: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          section_enrollment_id: string
          section_id: string | null
          start_date: string | null
          student_id: string | null
          tardies: number
          term_id: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          absences?: number
          created_at?: string | null
          customer_id?: string | null
          end_date?: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          section_enrollment_id?: string
          section_id?: string | null
          start_date?: string | null
          student_id?: string | null
          tardies?: number
          term_id?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Update: {
          absences?: number
          created_at?: string | null
          customer_id?: string | null
          end_date?: string | null
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          section_enrollment_id?: string
          section_id?: string | null
          start_date?: string | null
          student_id?: string | null
          tardies?: number
          term_id?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_enrollments_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "section_enrollments_section_id_sections_section_id_fk"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["section_id"]
          },
          {
            foreignKeyName: "section_enrollments_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "section_enrollments_term_id_terms_term_id_fk"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["term_id"]
          },
        ]
      }
      sections: {
        Row: {
          course_id: string
          course_number: string
          created_at: string | null
          customer_id: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          grade_level: string
          no_of_students: number
          section_id: string
          section_number: number
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          course_number: string
          created_at?: string | null
          customer_id?: string | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          grade_level: string
          no_of_students: number
          section_id?: string
          section_number: number
          transaction_date?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          course_number?: string
          created_at?: string | null
          customer_id?: string | null
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          grade_level?: string
          no_of_students?: number
          section_id?: string
          section_number?: number
          transaction_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_courses_course_id_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "sections_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      student_daily_absences: {
        Row: {
          absence_date: string
          created_at: string | null
          customer_id: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          normalized_absence_code: string | null
          school_id: string
          sis_code: string | null
          student_daily_absence_id: string
          student_id: string
          updated_at: string | null
          year_id: string
        }
        Insert: {
          absence_date: string
          created_at?: string | null
          customer_id: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          normalized_absence_code?: string | null
          school_id: string
          sis_code?: string | null
          student_daily_absence_id?: string
          student_id: string
          updated_at?: string | null
          year_id: string
        }
        Update: {
          absence_date?: string
          created_at?: string | null
          customer_id?: string
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          normalized_absence_code?: string | null
          school_id?: string
          sis_code?: string | null
          student_daily_absence_id?: string
          student_id?: string
          updated_at?: string | null
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_absences_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "student_daily_absences_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_daily_absences_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_daily_absences_year_id_years_year_id_fk"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["year_id"]
          },
        ]
      }
      student_grades: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string | null
          credit_hours_earned: number | null
          credit_type: string | null
          customer_id: string | null
          exclude_from_gpa: boolean | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          gpa_added_value: number | null
          gpa_points: number | null
          grade_code: string
          grade_id: string
          grade_letter: string | null
          grade_level: string | null
          grade_percent: number | null
          grade_status: string
          potential_credit_hours: number | null
          section_id: string
          source_api: string | null
          source_updated_date: string
          student_id: string
          term_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string | null
          credit_hours_earned?: number | null
          credit_type?: string | null
          customer_id?: string | null
          exclude_from_gpa?: boolean | null
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          gpa_added_value?: number | null
          gpa_points?: number | null
          grade_code: string
          grade_id?: string
          grade_letter?: string | null
          grade_level?: string | null
          grade_percent?: number | null
          grade_status: string
          potential_credit_hours?: number | null
          section_id: string
          source_api?: string | null
          source_updated_date: string
          student_id: string
          term_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string | null
          credit_hours_earned?: number | null
          credit_type?: string | null
          customer_id?: string | null
          exclude_from_gpa?: boolean | null
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          gpa_added_value?: number | null
          gpa_points?: number | null
          grade_code?: string
          grade_id?: string
          grade_letter?: string | null
          grade_level?: string | null
          grade_percent?: number | null
          grade_status?: string
          potential_credit_hours?: number | null
          section_id?: string
          source_api?: string | null
          source_updated_date?: string
          student_id?: string
          term_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_course_id_courses_course_id_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_grades_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "student_grades_section_id_sections_section_id_fk"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["section_id"]
          },
          {
            foreignKeyName: "student_grades_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_grades_term_id_terms_term_id_fk"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["term_id"]
          },
        ]
      }
      student_tags: {
        Row: {
          canonical_value_id: string | null
          created_at: string | null
          created_by_user_id: string
          source: Database["public"]["Enums"]["source"]
          student_id: string | null
          student_tag_id: string
          tag_id: string | null
          updated_at: string | null
          updated_by_user_id: string | null
          value: string
        }
        Insert: {
          canonical_value_id?: string | null
          created_at?: string | null
          created_by_user_id: string
          source: Database["public"]["Enums"]["source"]
          student_id?: string | null
          student_tag_id?: string
          tag_id?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          value: string
        }
        Update: {
          canonical_value_id?: string | null
          created_at?: string | null
          created_by_user_id?: string
          source?: Database["public"]["Enums"]["source"]
          student_id?: string | null
          student_tag_id?: string
          tag_id?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tags_canonical_value_id_tag_canonical_values_tag_canoni"
            columns: ["canonical_value_id"]
            isOneToOne: false
            referencedRelation: "tag_canonical_values"
            referencedColumns: ["tag_canonical_value_id"]
          },
          {
            foreignKeyName: "student_tags_created_by_user_id_users_user_id_fk"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_tags_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_tags_tag_id_tags_tag_id_fk"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["tag_id"]
          },
          {
            foreignKeyName: "student_tags_updated_by_user_id_users_user_id_fk"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          customer_id: string | null
          date_of_birth: string | null
          email: string | null
          enrollment_status: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          first_name: string
          full_name: string
          gender: string | null
          grade_level: number
          graduation_year: number | null
          homeroom_name: string | null
          last_name: string
          middle_name: string | null
          phone: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          enrollment_status: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          first_name: string
          full_name: string
          gender?: string | null
          grade_level: number
          graduation_year?: number | null
          homeroom_name?: string | null
          last_name: string
          middle_name?: string | null
          phone?: string | null
          student_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          enrollment_status?: string
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          first_name?: string
          full_name?: string
          gender?: string | null
          grade_level?: number
          graduation_year?: number | null
          homeroom_name?: string | null
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      tag_canonical_values: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          search_key_words: string | null
          tag_canonical_value_id: string
          tag_id: string | null
          updated_at: string | null
          updated_by_user_id: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          search_key_words?: string | null
          tag_canonical_value_id?: string
          tag_id?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          search_key_words?: string | null
          tag_canonical_value_id?: string
          tag_id?: string | null
          updated_at?: string | null
          updated_by_user_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_canonical_values_created_by_user_id_users_user_id_fk"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tag_canonical_values_tag_id_tags_tag_id_fk"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["tag_id"]
          },
          {
            foreignKeyName: "tag_canonical_values_updated_by_user_id_users_user_id_fk"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tag_categories: {
        Row: {
          name: string
          tag_category_id: string
        }
        Insert: {
          name: string
          tag_category_id?: string
        }
        Update: {
          name?: string
          tag_category_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          customer_id: string | null
          is_multi_value: boolean
          name: string
          tag_category_id: string | null
          tag_id: string
          updated_at: string | null
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          customer_id?: string | null
          is_multi_value?: boolean
          name: string
          tag_category_id?: string | null
          tag_id?: string
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          customer_id?: string | null
          is_multi_value?: boolean
          name?: string
          tag_category_id?: string | null
          tag_id?: string
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_user_id_users_user_id_fk"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tags_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "tags_tag_category_id_tag_categories_tag_category_id_fk"
            columns: ["tag_category_id"]
            isOneToOne: false
            referencedRelation: "tag_categories"
            referencedColumns: ["tag_category_id"]
          },
          {
            foreignKeyName: "tags_updated_by_user_id_users_user_id_fk"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      terms: {
        Row: {
          abbreviation: string
          created_at: string | null
          customer_id: string | null
          end_date: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name: string | null
          external_source: string
          school_id: string
          start_date: string
          term_id: string
          updated_at: string | null
          year_id: string
        }
        Insert: {
          abbreviation: string
          created_at?: string | null
          customer_id?: string | null
          end_date: string
          external_id: string
          external_key: string
          external_key_hash: string
          external_name?: string | null
          external_source?: string
          school_id: string
          start_date: string
          term_id?: string
          updated_at?: string | null
          year_id: string
        }
        Update: {
          abbreviation?: string
          created_at?: string | null
          customer_id?: string | null
          end_date?: string
          external_id?: string
          external_key?: string
          external_key_hash?: string
          external_name?: string | null
          external_source?: string
          school_id?: string
          start_date?: string
          term_id?: string
          updated_at?: string | null
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "terms_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "terms_year_id_years_year_id_fk"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["year_id"]
          },
        ]
      }
      user_school_memberships: {
        Row: {
          created_at: string | null
          role: string
          school_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          school_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          school_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_school_memberships_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "user_school_memberships_user_id_users_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          email: string
          eula_agree_timestamp: string | null
          first_name: string
          image_url: string | null
          last_name: string
          middle_name: string | null
          user_id: string
        }
        Insert: {
          auth_user_id: string
          email: string
          eula_agree_timestamp?: string | null
          first_name: string
          image_url?: string | null
          last_name: string
          middle_name?: string | null
          user_id: string
        }
        Update: {
          auth_user_id?: string
          email?: string
          eula_agree_timestamp?: string | null
          first_name?: string
          image_url?: string | null
          last_name?: string
          middle_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      years: {
        Row: {
          created_at: string
          end_year: number
          is_current: boolean
          name: string
          nominal_end_date: string | null
          nominal_start_date: string | null
          start_year: number
          updated_at: string
          year_external_id: string
          year_id: string
        }
        Insert: {
          created_at?: string
          end_year: number
          is_current?: boolean
          name: string
          nominal_end_date?: string | null
          nominal_start_date?: string | null
          start_year: number
          updated_at?: string
          year_external_id: string
          year_id?: string
        }
        Update: {
          created_at?: string
          end_year?: number
          is_current?: boolean
          name?: string
          nominal_end_date?: string | null
          nominal_start_date?: string | null
          start_year?: number
          updated_at?: string
          year_external_id?: string
          year_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      latest_student_grades: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string | null
          credit_hours_earned: number | null
          credit_type: string | null
          customer_id: string | null
          exclude_from_gpa: boolean | null
          external_id: string | null
          external_key: string | null
          external_key_hash: string | null
          external_name: string | null
          external_source: string | null
          gpa_added_value: number | null
          gpa_points: number | null
          grade_code: string | null
          grade_id: string | null
          grade_letter: string | null
          grade_level: string | null
          grade_percent: number | null
          grade_status: string | null
          potential_credit_hours: number | null
          section_id: string | null
          source_api: string | null
          source_updated_date: string | null
          student_id: string | null
          term_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_course_id_courses_course_id_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_grades_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "student_grades_section_id_sections_section_id_fk"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["section_id"]
          },
          {
            foreignKeyName: "student_grades_student_id_students_student_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_grades_term_id_terms_term_id_fk"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["term_id"]
          },
        ]
      }
      public_configuration: {
        Row: {
          config_id: string | null
          config_key: string | null
          created_at: string | null
          customer_id: string | null
          school_id: string | null
          updated_at: string | null
          user_id: string | null
          value: Json | null
        }
        Insert: {
          config_id?: string | null
          config_key?: string | null
          created_at?: string | null
          customer_id?: string | null
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Update: {
          config_id?: string | null
          config_key?: string | null
          created_at?: string | null
          customer_id?: string | null
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "configuration_customer_id_customers_customer_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "configuration_school_id_schools_school_id_fk"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "configuration_user_id_users_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_added_value_gpa: {
        Args: {
          p_credit_types?: string[]
          p_grade_codes?: string[]
          p_grade_levels?: number[]
          p_student_id: string
          p_year_labels?: string[]
        }
        Returns: number
      }
      calculate_credit_hour_weighted_gpa: {
        Args: {
          p_credit_types?: string[]
          p_grade_codes?: string[]
          p_grade_levels?: number[]
          p_student_id: string
          p_year_labels?: string[]
        }
        Returns: number
      }
      calculate_gpa_dispatch: {
        Args: {
          p_credit_types?: string[]
          p_grade_codes?: string[]
          p_grade_levels?: number[]
          p_method?: string
          p_student_id: string
          p_year_labels?: string[]
        }
        Returns: number
      }
      calculate_gpa_for_students: {
        Args: {
          p_credit_types?: string[]
          p_grade_codes?: string[]
          p_grade_levels?: number[]
          p_method?: string
          p_student_ids: string[]
          p_year_labels?: string[]
        }
        Returns: {
          gpa: number
          student_id: string
        }[]
      }
      calculate_simple_gpa: {
        Args: {
          p_credit_types?: string[]
          p_grade_codes?: string[]
          p_grade_levels?: number[]
          p_student_id: string
          p_year_labels?: string[]
        }
        Returns: number
      }
      execute_safe_select: {
        Args: { p_selected_school_id?: string; query_text: string }
        Returns: Json
      }
      fetch_public_config: {
        Args: {
          p_config_key: string
          p_customer_id?: string
          p_school_id?: string
          p_user_id?: string
        }
        Returns: {
          config_id: string | null
          config_key: string | null
          created_at: string | null
          customer_id: string | null
          school_id: string | null
          updated_at: string | null
          user_id: string | null
          value: Json | null
        }[]
      }
      get_current_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_student_grades: {
        Args: { p_student_id: string }
        Returns: {
          course_id: string
          course_name: string
          course_number: string
          grade_letter: string
          grade_percent: number
          term_abbreviation: string
          updated_at: string
        }[]
      }
      get_last_n_years_final_terms_gpa: {
        Args: { p_grade_codes?: string[]; p_n: number; p_student_id: string }
        Returns: {
          gpa: number
          grade_code: string
          year_name: string
        }[]
      }
      get_public_table_schema: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          comment: string
          data_type: string
        }[]
      }
      get_student_daily_absences_and_tardies: {
        Args: { p_student_id: string }
        Returns: {
          total_absences: number
          total_tardies: number
        }[]
      }
      get_student_year_labels: {
        Args: { p_student_id: string }
        Returns: string[]
      }
      list_public_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          comment: string
          name: string
        }[]
      }
    }
    Enums: {
      created_by: "agent" | "user"
      source: "manual" | "ai" | "import"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      created_by: ["agent", "user"],
      source: ["manual", "ai", "import"],
    },
  },
} as const

