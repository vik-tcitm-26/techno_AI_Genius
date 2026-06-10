/**
 * mediaService.js — TAG Media Library Service v7 (API-driven)
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
