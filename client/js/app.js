/**
 * apiService.js â€” TAG API Gateway v7
 * Centralizes frontend API requests and auth headers across services.
 */

const apiService = (() => {
  const API_BASE = '/api';
  const USE_API = true;

  function _authHeader() {
    const token = sessionStorage.getItem('tag_jwt');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request(path, options = {}) {
    const init = { ...options };
    init.headers = { ...(options.headers || {}) };

    if (init.body != null && !(init.body instanceof FormData)) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(init.body);
    }

    const res = await fetch(path, init);
    if (!res.ok) {
      const error = new Error(`API ${init.method || 'GET'} ${path} failed (${res.status})`);
      error.status = res.status;
      error.response = await res.text().catch(() => '');
      throw error;
    }

    if (res.status === 204) return null;
    const contentType = res.headers.get('Content-Type') || '';
    return contentType.includes('application/json') ? res.json() : res.text();
  }

  async function json(path, method = 'GET', data = null, includeAuth = true) {
    const headers = includeAuth ? _authHeader() : {};
    return request(`${API_BASE}${path}`, { method, headers, body: data });
  }

  async function form(path, formData, includeAuth = true) {
    const headers = includeAuth ? _authHeader() : {};
    return request(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  }

  return {
    API_BASE,
    USE_API,
    request,
    json,
    form,
    _authHeader
  };
})();
/**
 * storageService.js â€” TAG Storage Abstraction Layer v6 (API-driven)
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
/**
 * insightService.js â€” TAG Insights Service v6 (API-driven)
 * All operations delegate to storageService backend client.
 */

const insightService = (() => {
  const COLLECTION = 'insights';

  return {
    getAll() {
      return storageService.get(COLLECTION);
    },

    getPublished() {
      return storageService.query(COLLECTION, i => i.status === 'published' && i.visibility !== false);
    },

    getById(id) {
      return storageService.find(COLLECTION, id);
    },

    create(data) {
      return storageService.append(COLLECTION, data);
    },

    update(id, patch) {
      return storageService.update(COLLECTION, id, patch);
    },

    delete(id) {
      return storageService.remove(COLLECTION, id);
    },

    async togglePublish(id) {
      const item = await this.getById(id);
      if (!item) return null;
      const newStatus = item.status === 'published' ? 'draft' : 'published';
      return this.update(id, { status: newStatus });
    },

    async toggleVisibility(id) {
      const item = await this.getById(id);
      if (!item) return null;
      return this.update(id, { visibility: !item.visibility });
    }
  };
})();
/**
 * videoService.js â€” TAG Video Service v6 (API-driven)
 * Operations route to storageService. YouTube formatters remain client side.
 */

const videoService = (() => {
  const COLLECTION = 'videos';

  return {
    getAll() {
      return storageService.get(COLLECTION);
    },

    getEnabled() {
      return storageService.query(COLLECTION, v => v.visibility !== false);
    },



    getById(id) {
      return storageService.find(COLLECTION, id);
    },

    create(data) {
      return storageService.append(COLLECTION, { ...data, visibility: data.visibility !== false, featured: data.featured || false });
    },

    update(id, patch) {
      return storageService.update(COLLECTION, id, patch);
    },

    delete(id) {
      return storageService.remove(COLLECTION, id);
    },

    async toggleVisibility(id) {
      const v = await this.getById(id);
      return v ? this.update(id, { visibility: !v.visibility }) : null;
    },


  };
})();
/**
 * mediaService.js â€” TAG Media Library Service v7 (API-driven)
 * Uses apiService for multipart uploads and gallery operations.
 */

const mediaService = (() => {
  const COLLECTION = 'gallery';

  return {
    getAll() {
      return storageService.get(COLLECTION);
    },

    getByCategory(cat) {
      return storageService.query(COLLECTION, m => m.category === cat);
    },

    getById(id) {
      return storageService.find(COLLECTION, id);
    },

    delete(id) {
      return storageService.remove(COLLECTION, id);
    },

    update(id, patch) {
      return storageService.update(COLLECTION, id, patch);
    },

    async upload(file, meta = {}) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', meta.category || 'general');
        formData.append('caption', meta.caption || '');
        formData.append('alt', meta.alt || file.name);

        return await apiService.form('/media/upload', formData, true);
      } catch (err) {
        console.error('[mediaService] Upload error:', err);
        throw err;
      }
    },



    srcFor(item) {
      return item?.url || '';
    }
  };
})();

// ─────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS (replaces TAG global)
// ─────────────────────────────────────────────────────────────────────────

function getSiteSettings() {
  return storageService.getSettings().catch(() => ({
    siteName: 'Techno AI Genius',
    tagline: 'Open AI Education for the Next Generation',
    email: 'info@technoaigenius.com',
    youtubeChannel: 'https://www.youtube.com/@MindwareToMetaverse',
    formspreeId: '',
    showPodcast: true,
    showMedia: true,
    maintenanceMode: false
  }));
}

function getItemImage(item) {
  if (!item) return 'assets/blogs/blog-1.jpeg';
  if (item.imageData) return item.imageData;
  if (item.image_data) return item.image_data;
  if (item.url && item.url.startsWith('http')) return item.url;
  if (item.featuredImage && item.featuredImage.startsWith('http')) return item.featuredImage;
  if (item.featured_image && item.featured_image.startsWith('http')) return item.featured_image;
  const num = item.image || item.imageIndex || 1;
  return 'assets/blogs/blog-' + num + '.jpeg';
}
