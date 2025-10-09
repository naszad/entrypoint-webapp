'use client';

import { createContext, useContext } from 'react';
import { StudentInfo } from '@/types/StudentInfo';

interface StudentContextType {
  student: StudentInfo | null;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

export { StudentContext };

