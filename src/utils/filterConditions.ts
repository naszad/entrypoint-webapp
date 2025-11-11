export interface FilterCondition {
  id: string;
  displayValue: string;
}

export const TEXT_FILTER_CONDITIONS: FilterCondition[] = [
  { id: 'contains', displayValue: 'Contains' },
  { id: 'eq', displayValue: 'Equals' },
  { id: 'in', displayValue: 'In list' },
  { id: 'starts', displayValue: 'Starts with' },
  { id: 'ends', displayValue: 'Ends with' },
  { id: 'not', displayValue: 'Not Equal' },
  { id: 'not_contains', displayValue: 'Does not contain' },
  { id: 'is_empty', displayValue: 'Is Empty' },
  { id: 'is_not_empty', displayValue: 'Is Not Empty' },
];

export const NUMBER_FILTER_CONDITIONS: FilterCondition[] = [
  { id: 'eq', displayValue: 'Equals' },
  { id: 'in', displayValue: 'In list' },
  { id: 'gt', displayValue: 'Greater than' },
  { id: 'lt', displayValue: 'Less than' },
  { id: 'gte', displayValue: 'Greater than or equal to' },
  { id: 'lte', displayValue: 'Less than or equal to' },
  { id: 'not', displayValue: 'Not Equal' },
];

export const DEFAULT_FILTER_CONDITIONS: FilterCondition[] = [
  { id: 'eq', displayValue: 'Equals' }
];

export const getFilterConditionsByType = (filterType: string): FilterCondition[] => {
  switch (filterType) {
    case 'text':
      return TEXT_FILTER_CONDITIONS;
    case 'number':
      return NUMBER_FILTER_CONDITIONS;
    default:
      return DEFAULT_FILTER_CONDITIONS;
  }
};

export const getDisplayValueById = (id: string): string => {
  const allConditions = [
    ...TEXT_FILTER_CONDITIONS,
    ...NUMBER_FILTER_CONDITIONS,
    {id: 'in', displayValue: 'In list'}
  ];
  const condition = allConditions.find(c => c.id === id);
  return condition?.displayValue || 'Equals';
}; 