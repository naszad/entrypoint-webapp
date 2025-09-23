type StoredSchool = {
  schoolId?: string;
  name?: string;
  customerId?: string;
  customerName?: string;
};

const STORAGE_KEY = 'selectedSchool';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function saveSelectedSchool(school: StoredSchool | null) {
  if (!isBrowser()) return;
  const serialized = school ? JSON.stringify(school) : '';

  try {
    if (school) {
      window.sessionStorage.setItem(STORAGE_KEY, serialized);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }

  try {
    if (school) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }

  const schoolId = school?.schoolId ?? '';
  const customerId = school?.customerId ?? '';

  document.cookie = `selectedSchoolId=${encodeURIComponent(schoolId)}; path=/`;
  document.cookie = `customer_id=${encodeURIComponent(customerId)}; path=/`;
}

export function loadSelectedSchool(): StoredSchool | null {
  if (!isBrowser()) return null;

  const read = (source: Storage): StoredSchool | null => {
    try {
      const raw = source.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredSchool;
    } catch {
      return null;
    }
  };

  return read(window.sessionStorage) ?? read(window.localStorage);
}

export type { StoredSchool };
