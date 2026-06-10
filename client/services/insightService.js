/**
 * insightService.js — TAG Insights Service v6 (API-driven)
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

    getByType(type) {
      return storageService.query(COLLECTION, i => i.type === type);
    },

    getBySubcategory(sub) {
      return storageService.query(COLLECTION, i => i.subcategory === sub);
    },

    getFeatured() {
      return storageService.query(COLLECTION, i => i.featured === true && i.status === 'published');
    },

    getById(id) {
      return storageService.find(COLLECTION, id);
    },

    getBySlug(slug) {
      return storageService.query(COLLECTION, i => i.slug === slug).then(results => results[0] || null);
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
    },

    getImage(item) {
      if (item.imageData || item.image_data) return item.imageData || item.image_data;
      if (item.featuredImage && item.featuredImage.startsWith('http')) return item.featuredImage;
      if (item.featured_image && item.featured_image.startsWith('http')) return item.featured_image;
      if (item.url && item.url.startsWith('http')) return item.url;
      const num = item.image || item.imageIndex || 1;
      return `assets/blogs/blog-${num}.jpeg`;
    },

    getImage(item) {
      if (item.imageData || item.image_data) return item.imageData || item.image_data;
      if (item.featuredImage && item.featuredImage.startsWith('http')) return item.featuredImage;
      if (item.featured_image && item.featured_image.startsWith('http')) return item.featured_image;
      if (item.url && item.url.startsWith('http')) return item.url;
      const num = item.image || item.imageIndex || 1;
      return `assets/blogs/blog-${num}.jpeg`;
    }
  };
})();
