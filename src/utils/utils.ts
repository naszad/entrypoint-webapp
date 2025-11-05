import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import jaroWinkler from 'jaro-winkler';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validate UUID v4-like string
export function isValidUuid(value?: string): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
}

// Deterministic color from string (for profile fallback)
export function stringToColor(str: string): string {
  // Tailwind-friendly color palette (can be extended)
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-lime-500',
    'bg-emerald-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-fuchsia-500',
    'bg-amber-500',
    'bg-slate-500',
    'bg-zinc-500',
    'bg-neutral-500',
    'bg-stone-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getFuzzyMatchingValue(target: string, candidates: string[]): { bestMatch: string, score: number } {
  let bestMatch = '';
  let highestScore = 0;

  for (const candidate of candidates) {
    const score = jaroWinkler(target.toLowerCase(), candidate.toLowerCase());
    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
    }
  }

  return { bestMatch, score: highestScore };
}
