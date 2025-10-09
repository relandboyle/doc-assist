// Job Opener Module for Doc Tailor Extension
// Handles opening job links in new tabs

async function openAllJobLinks() {
  console.log('Starting openAllJobLinks function...');

  // First, scroll to the bottom to load all lazy-loaded job links
  console.log('Step 1: Scrolling to load all jobs...');
  await window.DocTailorJobScroller.scrollToLoadAllJobs();

  // Wait a bit for any final lazy loading to complete
  console.log('Step 2: Waiting for final lazy loading...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find all job links
  console.log('Step 3: Finding job links...');
  let jobLinks = document.querySelectorAll('a.job-card-container__link');
  console.log(`Found ${jobLinks.length} job links with selector 'a.job-card-container__link'`);

  // Try alternative selectors if the main one doesn't work
  if (jobLinks.length === 0) {
    console.log('Trying alternative selectors...');
    const alternativeSelectors = [
      'a[data-job-id]',
      '.job-card-container a',
      '.jobs-search-results__list-item a',
      'a[href*="/jobs/view/"]',
      '.job-card-list__title a'
    ];

    for (const selector of alternativeSelectors) {
      const altLinks = document.querySelectorAll(selector);
      console.log(`Selector '${selector}' found ${altLinks.length} links`);
      if (altLinks.length > 0) {
        // Use the first alternative selector that finds links
        jobLinks = altLinks;
        break;
      }
    }
  }

  if (jobLinks.length === 0) {
    console.log('No job links found with any selector');
    window.DocTailorModalUtils.showJobOpeningSummary(0, 0, 20);
    return;
  }

  // LinkedIn typically limits to around 20 tabs, so we'll respect that limit
  const maxTabs = 20;
  const linksToOpen = Array.from(jobLinks).slice(0, maxTabs);

  console.log(`Step 4: Opening ${linksToOpen.length} of ${jobLinks.length} job links...`);

  // Show user feedback about the operation
  console.log(`Note: LinkedIn limits tab opening to ${maxTabs} tabs. ${jobLinks.length - maxTabs} additional jobs were not opened.`);

  // Show modal summary immediately
  window.DocTailorModalUtils.showJobOpeningSummary(jobLinks.length, linksToOpen.length, maxTabs);

  // Open each job link in a new tab (simulating middle-click behavior)
  linksToOpen.forEach((link, index) => {
    // Add a 300ms delay between each click to avoid overwhelming the browser
    setTimeout(() => {
      const href = link.getAttribute('href');
      console.log(`Opening job ${index + 1}: ${href}`);
      if (href) {
        // Ensure the URL is absolute
        const absoluteUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
        const newTab = window.open(absoluteUrl, '_blank', 'noopener');

        // Keep the original tab active by focusing back to it after opening each new tab
        if (newTab) {
          // Small delay to ensure the new tab opens, then focus back to original tab
          setTimeout(() => {
            window.focus();
          }, 50);
        }
      }
    }, index * 300); // 300ms delay between each click
  });
}

// Export functions for use in other modules
window.DocTailorJobOpener = {
  openAllJobLinks
};
