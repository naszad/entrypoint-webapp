// This file now re-exports the universal SchoolYears model for backward compatibility
// The old school-specific Years table has been replaced with universal SchoolYears

export { schoolYears as years } from './SchoolYears';
export type { SchoolYear as Year } from './SchoolYears';
