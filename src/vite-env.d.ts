/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_COZE_API_KEY: string;
  readonly VITE_COZE_BOT_ID: string;
  readonly VITE_COZE_API_ENDPOINT: string;
  readonly VITE_COZE_B2B_BOT_ID: string;
  /**
   * When "true", every user sees placeholder surfaces/sub-tabs too (for QA / dev
   * preview without needing an admin role). Default: false.
   *
   * Setting this also disables working-page count filtering in SurfaceTabs so
   * you can see ALL surfaces and ALL sub-tabs, even those that only redirect
   * to Placeholder.
   */
  readonly VITE_ENABLE_PLATFORM?: string;
  readonly VITE_ENABLE_ADMIN_PREVIEW?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
