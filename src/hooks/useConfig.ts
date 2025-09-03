'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FINALIZED_GRADE_CODES, ALL_GRADE_CODES, CURRENT_YEAR_GRADE_CODES } from '@/utils/gradeCodes';

export function useConfig(configKeys: string[]) {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (!user?.userId || configKeys.length === 0) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const configKeysString = configKeys.join(',');
        const response = await fetch(`/api/config?userId=${user.userId}&configKeys=${configKeysString}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        
        const data = await response.json();
        
        setConfigs(data);
      } catch (err) {
        console.warn('Failed to fetch config, using fallback values:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user?.userId, configKeys]);

  // Getter functions with fallbacks
  const getGradeCodeSort = (): string[] => {  
    return configs && configs['grade_code_sort'] 
      ? configs['grade_code_sort']
      : [...ALL_GRADE_CODES];
  };

  const getFinalGradeCodes = (): string[] => {
    return configs && configs['final_grade_codes'] 
      ? configs['final_grade_codes'] 
      : [...FINALIZED_GRADE_CODES];
  };

  const getCurrentYearGradeCodes = (): string[] => {
    return configs && configs['current_year_grade_codes'] 
      ? configs['current_year_grade_codes'] 
      : [...CURRENT_YEAR_GRADE_CODES];
  };

  return {
    loading,
    error,
    gradeCodeSort: getGradeCodeSort(),
    finalGradeCodes: getFinalGradeCodes(),
    currentYearGradeCodes: getCurrentYearGradeCodes()
  };
}
