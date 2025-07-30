// Shared grade code constants used across the application

// Default grade codes used for GPA calculations
export const FINALIZED_GRADE_CODES = ['S1', 'S2'] as const;

// All possible grade codes
export const ALL_GRADE_CODES = ['Q1', 'Q2', 'S1', 'Q3', 'Q4', 'S2'] as const;

// Current year grade codes
export const CURRENT_YEAR_GRADE_CODES = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

// Type definitions
export type GradeCode = typeof ALL_GRADE_CODES[number];
export type DefaultGpaGradeCode = typeof FINALIZED_GRADE_CODES[number]; 