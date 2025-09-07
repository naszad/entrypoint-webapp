interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  APP_URL: string;
}

declare global {
  interface Window {
    env: Env;
  }
}

export {};
