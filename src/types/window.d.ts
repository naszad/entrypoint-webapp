interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  APP_URL: string;
  CHAT_TIMEOUT_HOURS: string;
  ENABLE_DEV_OPTIONS: string;
}

declare global {
  interface Window {
    env: Env;
  }
}

export {};
