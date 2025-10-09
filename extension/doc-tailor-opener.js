// Doc-Tailor Opener Module for Doc Tailor Extension
// Handles opening jobs in Doc-Tailor with proper tab management

async function openAllJobsInDocTailor() {
  console.log('Starting openAllJobsInDocTailor function...');
  console.log('Function called from:', new Error().stack);

  // First, scroll to the bottom to load all lazy-loaded job links
  console.log('Step 1: Scrolling to load all jobs...');
  console.log('Page height before scrolling:', document.body.scrollHeight);
  await window.DocTailorJobScroller.scrollToLoadAllJobs();
  console.log('Page height after scrolling:', document.body.scrollHeight);

  // Wait a bit for any final lazy loading to complete
  console.log('Step 2: Waiting for final lazy loading...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find all job links
  console.log('Step 3: Finding job links...');
  let jobLinks = document.querySelectorAll('a.job-card-container__link');
  console.log(`Found ${jobLinks.length} job links with selector 'a.job-card-container__link'`);

  // Debug: Log all links on the page to see what's available
  const allLinks = document.querySelectorAll('a');
  console.log(`Total links on page: ${allLinks.length}`);

  // Log some sample links to see their structure
  const sampleLinks = Array.from(allLinks).slice(0, 10);
  sampleLinks.forEach((link, index) => {
    console.log(`Link ${index + 1}: href="${link.href}", class="${link.className}"`);
  });

  // Try alternative selectors if the main one doesn't work
  if (jobLinks.length === 0) {
    console.log('Trying alternative selectors...');
    const alternativeSelectors = [
      'a[data-job-id]',
      '.job-card-container a',
      '.jobs-search-results__list-item a',
      'a[href*="/jobs/view/"]',
      '.job-card-list__title a',
      'a[href*="/jobs/view"]',
      '.job-card-list a',
      '.jobs-search-results a'
    ];

    for (const selector of alternativeSelectors) {
      const altLinks = document.querySelectorAll(selector);
      console.log(`Selector '${selector}' found ${altLinks.length} links`);
      if (altLinks.length > 0) {
        jobLinks = altLinks;
        break;
      }
    }
  }

  if (jobLinks.length === 0) {
    console.log('No job links found with any selector');
    window.DocTailorModalUtils.showDocTailorOpeningSummary(0, 0, 20);
    return;
  }

  // LinkedIn typically limits to around 20 tabs, so we'll respect that limit
  const maxTabs = 20;
  const linksToOpen = Array.from(jobLinks).slice(0, maxTabs);

  console.log(`Step 4: Opening ${linksToOpen.length} of ${jobLinks.length} jobs in Doc-Tailor...`);

  // Show user feedback about the operation
  console.log(`Note: LinkedIn limits tab opening to ${maxTabs} tabs. ${jobLinks.length - maxTabs} additional jobs were not opened.`);

  // Show modal summary immediately
  window.DocTailorModalUtils.showDocTailorOpeningSummary(jobLinks.length, linksToOpen.length, maxTabs);

  // Step 1: Open all LinkedIn tabs first (without auto-trigger)
  console.log('Step 1: Opening all LinkedIn tabs...');
  linksToOpen.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (href) {
      console.log(`Opening LinkedIn job ${index + 1}/${linksToOpen.length}: ${href}`);

      // Ensure the URL is absolute
      const absoluteUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;

      // Add only the tabIndex parameter (no auto-trigger yet)
      const urlWithParams = absoluteUrl + (absoluteUrl.includes('?') ? '&' : '?') +
        `tabIndex=${index + 1}`;

      // Open the job in a new tab
      const newTab = window.open(urlWithParams, `linkedin-job-${index + 1}`, 'noopener');

      if (newTab) {
        console.log(`LinkedIn job tab ${index + 1} opened successfully`);
      } else {
        console.error(`Failed to open LinkedIn job tab ${index + 1}`);
      }
    }
  });

  // Step 2: Wait for LinkedIn tabs to open, then systematically open and position Doc-Tailor tabs
  console.log('Step 2: Waiting for LinkedIn tabs to open, then opening Doc-Tailor tabs...');
  setTimeout(() => {
    openDocTailorTabsSequentially(linksToOpen);
  }, 2000); // Wait 2 seconds for LinkedIn tabs to open
}

async function openDocTailorTabsSequentially(linksToOpen) {
  console.log('Starting sequential Doc-Tailor tab opening and positioning...');

  for (let index = 0; index < linksToOpen.length; index++) {
    const link = linksToOpen[index];
    const href = link.getAttribute('href');

    if (href) {
      console.log(`Processing job ${index + 1}/${linksToOpen.length}: ${href}`);

      // Ensure the URL is absolute
      const absoluteUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;

      try {
        // Step 1: Open Doc-Tailor tab normally (it will appear at the end)
        console.log(`Step 1: Opening Doc-Tailor tab for job ${index + 1}`);
        const docTailorUrl = await getDocTailorUrl(absoluteUrl);

        const docTailorTab = await chrome.runtime.sendMessage({
          action: 'createDocTailorTabAtEnd',
          url: docTailorUrl,
          tabIndex: index + 1
        });

        if (docTailorTab.success) {
          console.log(`Step 2: Doc-Tailor tab opened, now positioning after LinkedIn tab ${index + 1}`);

          // Step 2: Move the Doc-Tailor tab to the correct position
          const moveResult = await chrome.runtime.sendMessage({
            action: 'moveDocTailorTab',
            docTailorTabId: docTailorTab.tabId,
            linkedInTabIndex: index + 1
          });

          if (moveResult.success) {
            console.log(`Job ${index + 1} Doc-Tailor tab positioned successfully`);
          } else {
            console.error(`Failed to position Doc-Tailor tab for job ${index + 1}: ${moveResult.error}`);
          }
        } else {
          console.error(`Failed to open Doc-Tailor tab for job ${index + 1}: ${docTailorTab.error}`);
        }
      } catch (error) {
        console.error(`Error processing job ${index + 1}:`, error);
      }

      // Wait a bit between each job to avoid overwhelming the browser
      if (index < linksToOpen.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log('All Doc-Tailor tabs processed');
}

async function getDocTailorUrl(jobUrl) {
  const appOrigin = await window.DocTailorUtils.getAppOrigin();

  // Pass the job URL directly - Doc-Tailor will extract the job context from the URL
  const params = {
    jobUrl: jobUrl
  };

  const qs = new URLSearchParams(params).toString();
  return appOrigin.replace(/\/+$/, '') + '/dashboard/builder?' + qs;
}

// Export functions for use in other modules
window.DocTailorDocTailorOpener = {
  openAllJobsInDocTailor,
  openDocTailorTabsSequentially,
  getDocTailorUrl
};
