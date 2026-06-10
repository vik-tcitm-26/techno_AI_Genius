/**
 * authService.js — TAG Auth Service v7 (API-driven)
 * Uses apiService for auth calls and session token management.
 */

const authService = (() => {
  return {
    async login(password) {
      try {
        const data = await apiService.json('/auth/login', 'POST', { password }, false);
        if (data?.token) {
          storageService.setSession(data.token);
          return true;
        }
        return false;
      } catch (err) {
        console.error('[authService] Login error:', err);
        return false;
      }
    },

    logout() {
      storageService.clearSession();
      return Promise.resolve(true);
    },

    isAuthenticated() {
      return !!storageService.getSession();
    },

    async changePassword(current, newPw) {
      try {
        await apiService.json('/auth/change-password', 'POST', { current, newPw }, true);
        return { ok: true };
      } catch (err) {
        console.error('[authService] Change password error:', err);
        return { ok: false, error: err.response || 'Network or server error.' };
      }
    },


  };
})();
