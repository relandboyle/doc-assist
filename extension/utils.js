// Cross-browser storage namespace
const api = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_ORIGIN = 'https://doc-tailor.com';

function extractJobContext() {
  let name = '';
  let title = '';
  const pick = (sel, root) => (root || document).querySelector(sel);
  const poster = pick('.jobs-poster__name');
  if (poster) {
    const strong = pick('strong', poster);
    if (strong && strong.textContent) {
      name = String(strong.textContent).trim();
    }
  }
  const info = pick('.hirer-card__hirer-information');
  if (info) {
    const small = pick('.text-body-small', info);
    const raw = (small && small.textContent) ? String(small.textContent) : '';
    const parts = raw.split('\n');
    const line = parts.length > 1 ? parts[1] : '';
    title = line ? line.replace(/^\s+/, '') : '';
  }
  const jobUrl = location.href;
  const params = { jobUrl };
  if (name && title) {
    params.hiringName = name;
    params.hiringTitle = title;
  }
  return params;
}

function getStore() {
  try {
    return (api.storage && api.storage.sync) || api.storage.local;
  } catch (e) {
    return { get: (d, cb) => cb(d), set: (_d, cb) => cb && cb() };
  }
}

function getAppOrigin() {
  return new Promise((resolve) => {
    try {
      getStore().get({ appOrigin: DEFAULT_ORIGIN }, (res) => {
        const origin = (res && res.appOrigin) || DEFAULT_ORIGIN;
        resolve(origin);
      });
    } catch (e) {
      resolve(DEFAULT_ORIGIN);
    }
  });
}

function isJobViewPage() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Check if we're on a LinkedIn job view page
  // Pattern: /jobs/view/1234567890/ or /jobs/view/1234567890
  return pathname.match(/^\/jobs\/view\/\d+\/?$/);
}

function isJobSearchPage() {
  const pathname = window.location.pathname;

  // Check if we're on a LinkedIn job search page
  // Pattern: /jobs/search/ or /jobs/search with optional query parameters
  return pathname.match(/^\/jobs\/search\/?/);
}

function isAnyJobsPage() {
  const pathname = window.location.pathname;

  // Check if we're on any LinkedIn jobs page
  // Pattern: /jobs/ followed by anything
  return pathname.match(/^\/jobs\//);
}

async function loadSavedPosition() {
  return new Promise((resolve) => {
    try {
      getStore().get({ fabPosition: 'top-right' }, (res) => {
        const savedPosition = (res && res.fabPosition) || 'top-right';
        resolve(savedPosition);
      });
    } catch (e) {
      resolve('top-right');
    }
  });
}

async function openDocTailor(tabIndex = null) {
  const appOrigin = await getAppOrigin();
  const params = extractJobContext();
  const qs = new URLSearchParams(params).toString();
  const url = appOrigin.replace(/\/+$/, '') + '/dashboard/builder?' + qs;

  if (tabIndex) {
    console.log(`Opening Doc-Tailor for job ${tabIndex} and positioning after LinkedIn tab`);

    try {
      // Send message to background script to create the tab at the correct position
      const response = await chrome.runtime.sendMessage({
        action: 'createDocTailorTab',
        url: url,
        tabIndex: tabIndex
      });

      if (response.success) {
        console.log(`Doc-Tailor tab created at correct position for job ${tabIndex}`);
      } else {
        console.log(`Failed to position Doc-Tailor tab: ${response.error}, opening normally`);
        window.open(url, '_blank', 'noopener');
      }
    } catch (error) {
      console.error('Error communicating with background script:', error);
      // Fallback: just use the original method
      window.open(url, '_blank', 'noopener');
    }
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

// Export functions for use in other modules
window.DocTailorUtils = {
  extractJobContext,
  getStore,
  getAppOrigin,
  isJobViewPage,
  isJobSearchPage,
  isAnyJobsPage,
  loadSavedPosition,
  openDocTailor
};
