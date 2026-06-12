import { STORAGE_KEY } from './constants';

export function loadAll() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('LocalStorage not available');
      return defaultData();
    }

    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem('canvo_v1')
      || localStorage.getItem('flowmind_v1')
      || localStorage.getItem('thoughtboard_workspace')
      || localStorage.getItem('ideacanvas_workspace');

    if (!raw) return defaultData();

    const data = JSON.parse(raw);

    // Validate data structure
    if (!data || typeof data !== 'object') {
      console.warn('Invalid data structure in storage');
      return defaultData();
    }

    // Migration: convert old single-page format to multi-page
    if (data.cards && !data.pages) {
      const id = 'page-1';
      return {
        pages: [{
          id,
          name: 'My First Board',
          icon: '💡',
          cards: Array.isArray(data.cards) ? data.cards : [],
          arrows: Array.isArray(data.arrows) ? data.arrows : [],
          snapEnabled: false,
          createdAt: new Date().toISOString()
        }],
        activePageId: id,
        theme: data.theme || 'light'
      };
    }

    // Validate pages array
    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      console.warn('Invalid pages array in storage');
      return defaultData();
    }

    // Ensure theme is set
    if (!data.theme) data.theme = 'light';

    // Validate activePageId exists
    if (!data.activePageId || !data.pages.some(p => p.id === data.activePageId)) {
      data.activePageId = data.pages[0].id;
    }

    // Validate each page structure
    data.pages = data.pages.map(page => ({
      ...page,
      cards: Array.isArray(page.cards) ? page.cards : [],
      arrows: Array.isArray(page.arrows) ? page.arrows : [],
      snapEnabled: typeof page.snapEnabled === 'boolean' ? page.snapEnabled : false,
    }));

    return data;
  } catch (err) {
    console.error('Failed to load data from storage:', err);
    return defaultData();
  }
}

function defaultData() {
  const id = 'page-' + Date.now();
  return { pages: [{ id, name: 'My First Board', icon: '💡', cards: [], arrows: [], snapEnabled: false, createdAt: new Date().toISOString() }], activePageId: id, theme: 'light' };
}

export function saveAll(data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('LocalStorage not available');
      return false;
    }

    // Validate data before saving
    if (!data || typeof data !== 'object') {
      console.error('Invalid data structure for saving');
      return false;
    }

    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      console.error('Invalid pages array for saving');
      return false;
    }

    const serialized = JSON.stringify(data);

    // Check approximate size (1 char ≈ 2 bytes in UTF-16)
    const sizeKB = (serialized.length * 2) / 1024;
    if (sizeKB > 4096) { // Warn if approaching 5MB limit
      console.warn(`Storage size is ${sizeKB.toFixed(0)}KB - approaching localStorage limit`);
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    // Handle quota exceeded error
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error('LocalStorage quota exceeded. Data not saved.');
      alert('Storage limit reached. Please delete some cards or boards to continue saving.');
      return false;
    }
    console.error('Failed to save data:', err);
    return false;
  }
}
