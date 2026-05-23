/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_SUPABASE_URL: string; readonly VITE_SUPABASE_KEY: string; readonly VITE_SUPABASE_ANON_KEY: string; readonly VITE_DEEPSEEK_API_KEY: string; readonly VITE_COZE_API_KEY: string; readonly VITE_COZE_BOT_ID: string; readonly VITE_COZE_API_ENDPOINT: string; readonly VITE_COZE_B2B_BOT_ID: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
