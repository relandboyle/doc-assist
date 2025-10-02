// Main Content Script for Doc Tailor Extension
// Orchestrates the extension functionality by coordinating the modules

function setup() {
  // Setup FAB on job view pages and job search pages
  if (window.DocTailorUtils.isJobViewPage() || window.DocTailorUtils.isJobSearchPage()) {
    window.DocTailorUI.setupFAB();
  }
}

// Initial setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}

// Handle navigation in single-page applications like LinkedIn
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Small delay to allow page to settle
    setTimeout(setup, 1000);
  }
}).observe(document, { subtree: true, childList: true });
