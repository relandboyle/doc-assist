// Job Handlers Module for Doc Tailor Extension
// Main coordination module for job search functionality and opening job links

// Import and expose functions from other modules
async function openAllJobLinks() {
  return window.DocTailorJobOpener.openAllJobLinks();
}

async function openAllJobsInDocTailor() {
  return window.DocTailorDocTailorOpener.openAllJobsInDocTailor();
}

async function scrollToLoadAllJobs() {
  return window.DocTailorJobScroller.scrollToLoadAllJobs();
}

// Export functions for use in other modules
window.DocTailorJobHandlers = {
  openAllJobLinks,
  openAllJobsInDocTailor,
  scrollToLoadAllJobs
};
