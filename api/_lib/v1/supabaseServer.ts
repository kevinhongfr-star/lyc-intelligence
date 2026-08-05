/**
 * v1 Supabase server client — re-exports from supabaseRest for naming
 * consistency within the v1/ module tree.
 *
 * The v1 framework imports from this file so it has a clean, versioned
 * import path; the actual implementation lives in the shared supabaseRest
 * module to avoid duplicating the fetch-with-timeout logic.
 */

export {
  isSupabaseConfigured,
  select,
  selectOne,
  insert,
  update,
  deleteRows,
  countRows,
  handleError,
} from '../supabaseRest.js';
