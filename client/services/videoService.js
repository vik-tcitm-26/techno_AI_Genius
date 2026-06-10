/**
 * videoService.js — TAG Video Service v6 (API-driven)
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
