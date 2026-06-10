/**
 * storageService.js — TAG Storage Abstraction Layer v6 (API-driven)
 * Uses apiService to centralize HTTP request handling.
 */

const storageService = (() => {
  async function get(collection) {
    try {
      return await apiService.json(`/${collection}`);
    } catch (err) {
      console.error(`[storageService] Error getting ${collection}:`, err);
      return [];
    }
  }

  async function set(collection, data) {
    try {
      await apiService.json(`/${collection}`, 'PUT', data, true);
      return true;
    } catch (err) {
      console.error(`[storageService] Error setting ${collection}:`, err);
      return false;
    }
  }

  async function append(collection, item) {
    try {
      return await apiService.json(`/${collection}`, 'POST', item, true);
    } catch (err) {
      console.error(`[storageService] Error appending to ${collection}:`, err);
      return null;
    }
  }

  async function update(collection, id, patch) {
    try {
      return await apiService.json(`/${collection}/${id}`, 'PUT', patch, true);
    } catch (err) {
      console.error(`[storageService] Error updating ${collection}/${id}:`, err);
      return null;
    }
  }

  async function remove(collection, id) {
    try {
      await apiService.json(`/${collection}/${id}`, 'DELETE', null, true);
      return true;
    } catch (err) {
      console.error(`[storageService] Error removing ${collection}/${id}:`, err);
      return false;
    }
  }

  async function find(collection, id) {
    try {
      return await apiService.json(`/${collection}/${id}`);
    } catch (err) {
      console.error(`[storageService] Error finding ${collection}/${id}:`, err);
      return null;
    }
  }

  return {
    async get(collection) {
      return get(collection);
    },

    async set(collection, data) {
      return set(collection, data);
    },

    async append(collection, item) {
      return append(collection, item);
    },

    async update(collection, id, patch) {
      return update(collection, id, patch);
    },

    async remove(collection, id) {
      return remove(collection, id);
    },

    async find(collection, id) {
      return find(collection, id);
    },

    async query(collection, fn) {
      const arr = await get(collection);
      return arr.filter(fn);
    },

    async getSettings() {
      try {
        return await apiService.json('/settings');
      } catch (err) {
        console.error('[storageService] Error getting settings:', err);
        return {};
      }
    },

    async setSettings(obj) {
      try {
        return !!(await apiService.json('/settings', 'PUT', obj, true));
      } catch (err) {
        console.error('[storageService] Error setting settings:', err);
        return false;
      }
    },

    setSession(v) {
      sessionStorage.setItem('tag_jwt', v);
    },

    getSession() {
      return sessionStorage.getItem('tag_jwt');
    },

    clearSession() {
      sessionStorage.removeItem('tag_jwt');
    },

    resetAll() {
      this.clearSession();
    }
  };
})();
