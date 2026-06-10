/**
 * apiService.js — TAG API Gateway v7
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
