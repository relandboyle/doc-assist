// Main Content Script for Doc Tailor Extension
// Orchestrates the extension functionality by coordinating the modules

function setup() {
  console.log('Doc Tailor: Setup called');
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Is job view page:', window.DocTailorUtils.isJobViewPage());
  console.log('Is job search page:', window.DocTailorUtils.isJobSearchPage());

  // Setup FAB on job view pages and job search pages
  if (window.DocTailorUtils.isJobViewPage() || window.DocTailorUtils.isJobSearchPage()) {
    console.log('Doc Tailor: Setting up FAB');
    window.DocTailorUI.setupFAB();

    // Note: Auto-trigger functionality removed - now using systematic tab opening approach
  } else {
    console.log('Doc Tailor: Not setting up FAB - not on supported page');
  }
}

// Initial setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}

// Interval-based page detection for LinkedIn SPA navigation
let setupInterval = null;

function startPageDetection() {
  if (setupInterval) return; // Already running

  console.log('Doc Tailor: Starting interval-based page detection');

  setupInterval = setInterval(() => {
    const isAnyJobs = window.DocTailorUtils.isAnyJobsPage();
    const isJobSearch = window.DocTailorUtils.isJobSearchPage();
    const isJobView = window.DocTailorUtils.isJobViewPage();

    // If we're on any jobs page and not already set up
    if (isAnyJobs && !document.getElementById('doc-tailor-fab')) {
      // Set up FAB immediately for job view pages
      if (isJobView) {
        console.log('Doc Tailor: Detected job view page, setting up FAB');
        setup();
        clearInterval(setupInterval);
        setupInterval = null;
      }
      // Set up FAB when we reach job search page
      else if (isJobSearch) {
        console.log('Doc Tailor: Detected job search page, setting up FAB');
        setup();
        clearInterval(setupInterval);
        setupInterval = null;
      }
    }
    // If we're no longer on any jobs page, clean up
    else if (!isAnyJobs && document.getElementById('doc-tailor-fab')) {
      console.log('Doc Tailor: Left jobs pages, cleaning up');
      const existingFab = document.getElementById('doc-tailor-fab');
      const existingFlyout = document.getElementById('doc-tailor-flyout');
      if (existingFab) existingFab.remove();
      if (existingFlyout) existingFlyout.remove();
      clearInterval(setupInterval);
      setupInterval = null;
    }
  }, 500); // Check every 500ms
}

// Start the interval detection
startPageDetection();
