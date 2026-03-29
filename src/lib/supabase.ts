// Supabase removed — all data now goes through /api/* Express routes
// This stub prevents import errors in any file that still references it
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { access_token: localStorage.getItem('nethra_token') || '' } } }),
    signOut: async () => {},
  },
  from: () => ({ select: () => ({ data: [], error: null }) }),
};
