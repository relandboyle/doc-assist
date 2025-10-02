// Job Handlers Module for Doc Tailor Extension
// Handles job search functionality and opening job links

async function openAllJobLinks() {
  console.log('Starting openAllJobLinks function...');

  // First, scroll to the bottom to load all lazy-loaded job links
  console.log('Step 1: Scrolling to load all jobs...');
  await scrollToLoadAllJobs();

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
    showJobOpeningSummary(0, 0, 20);
    return;
  }

  // LinkedIn typically limits to around 20 tabs, so we'll respect that limit
  const maxTabs = 20;
  const linksToOpen = Array.from(jobLinks).slice(0, maxTabs);

  console.log(`Step 4: Opening ${linksToOpen.length} of ${jobLinks.length} job links...`);

  // Show user feedback about the operation
  console.log(`Note: LinkedIn limits tab opening to ${maxTabs} tabs. ${jobLinks.length - maxTabs} additional jobs were not opened.`);

  // Show modal summary immediately
  showJobOpeningSummary(jobLinks.length, linksToOpen.length, maxTabs);

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

function showJobOpeningSummary(totalJobs, openedJobs, maxTabs) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10004;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    position: relative;
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = '#f0f0f0';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
  });

  // Create modal content
  const title = document.createElement('h3');
  title.textContent = 'Job Opening Summary';
  title.style.cssText = `
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  `;

  const summary = document.createElement('div');
  summary.style.cssText = `
    margin-bottom: 20px;
    line-height: 1.6;
    color: #333;
  `;

  if (totalJobs > maxTabs) {
    summary.innerHTML = `
      <p><strong>Found ${totalJobs} job postings</strong> in the search results.</p>
      <p><strong>Opened ${openedJobs} jobs</strong> in new tabs.</p>
      <p style="color: #f59e0b; font-weight: 500;">⚠️ LinkedIn limits tab opening to ${maxTabs} tabs at once.</p>
      <p style="color: #666; font-size: 14px;">${totalJobs - openedJobs} additional jobs were not opened due to this limitation.</p>
    `;
  } else {
    summary.innerHTML = `
      <p><strong>Found ${totalJobs} job postings</strong> in the search results.</p>
      <p><strong>Successfully opened all ${openedJobs} jobs</strong> in new tabs.</p>
    `;
  }

  const tips = document.createElement('div');
  tips.style.cssText = `
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
    border-left: 4px solid #0a66c2;
  `;

  tips.innerHTML = `
    <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0a66c2;">💡 Doc Tailor Tips:</h4>
    <ul style="margin: 0; padding-left: 16px; font-size: 14px; color: #666;">
      <li>Close some tabs and try "Open All Jobs" again to open more job postings</li>
      <li>Use Doc Tailor's Document Builder to create tailored applications for each job</li>
      <li>Bookmark jobs you're interested in, then use Doc Tailor's bookmarklet for quick access</li>
    </ul>
  `;

  const closeModal = () => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };

  closeButton.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Add escape key listener
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  modal.appendChild(closeButton);
  modal.appendChild(title);
  modal.appendChild(summary);
  modal.appendChild(tips);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);
}

async function scrollToLoadAllJobs() {
  return new Promise((resolve) => {
    console.log('Starting scroll to load all jobs...');

    // Try multiple selectors to find the results container
    const possibleSelectors = [
      '.scaffold-layout__list',
      '.jobs-search-results-list',
      '.jobs-search-results',
      '[data-test-id="search-results"]',
      '.jobs-search-results-list__list',
      '.scaffold-layout__content',
      'main[role="main"]'
    ];

    let resultsContainer = null;
    for (const selector of possibleSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`Found container with selector: ${selector}`);

        // For scaffold-layout__list, get the first direct child div (not nested)
        if (selector === '.scaffold-layout__list') {
          // Get all direct child divs and find the one that's not a header
          const directChildren = Array.from(container.children).filter(child => child.tagName === 'DIV');
          console.log(`Found ${directChildren.length} direct child divs`);

          // Look for the first div that's not a header or contains job results
          let targetDiv = null;
          for (const child of directChildren) {
            console.log(`Checking child div: ${child.className || 'no class'}`);
            // Skip header elements and look for the main content area
            if (!child.classList.contains('scaffold-layout__header') &&
                !child.querySelector('header') &&
                child.children.length > 0) {
              targetDiv = child;
              console.log(`Selected child div with class: ${child.className || 'no class'}`);
              break;
            }
          }

          if (targetDiv) {
            resultsContainer = targetDiv;
            console.log('Using selected child div of scaffold-layout__list for scrolling');
          } else {
            resultsContainer = container;
            console.log('No suitable child div found, using scaffold-layout__list directly');
          }
        } else {
          resultsContainer = container;
        }
        break;
      }
    }

    if (!resultsContainer) {
      console.log('No results container found, trying window scroll');
      // Fallback to window scrolling
      scrollWindowToLoadJobs().then(resolve);
      return;
    }

    let lastHeight = 0;
    let stableCount = 0;
    const maxStableChecks = 3;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;

    const scrollInterval = setInterval(() => {
      scrollAttempts++;
      const currentHeight = resultsContainer.scrollHeight;

      console.log(`Scroll attempt ${scrollAttempts}: height ${currentHeight}, lastHeight ${lastHeight}`);

      if (currentHeight === lastHeight) {
        stableCount++;
        console.log(`Height stable for ${stableCount} checks`);
        if (stableCount >= maxStableChecks) {
          console.log('Scrolling complete - height stable');
          clearInterval(scrollInterval);
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
        console.log('Height changed, continuing to scroll');
      }

      // Try multiple scroll methods
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      resultsContainer.scrollTo(0, resultsContainer.scrollHeight);

      // Also try scrolling the window
      window.scrollTo(0, document.body.scrollHeight);

      if (scrollAttempts >= maxScrollAttempts) {
        console.log('Max scroll attempts reached');
        clearInterval(scrollInterval);
        resolve();
        return;
      }
    }, 300); // Faster scrolling

    // Fallback timeout
    setTimeout(() => {
      console.log('Scroll timeout reached');
      clearInterval(scrollInterval);
      resolve();
    }, 8000);
  });
}

async function scrollWindowToLoadJobs() {
  return new Promise((resolve) => {
    console.log('Using window scroll fallback');
    let lastHeight = 0;
    let stableCount = 0;
    const maxStableChecks = 3;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;

    const scrollInterval = setInterval(() => {
      scrollAttempts++;
      const currentHeight = document.body.scrollHeight;

      console.log(`Window scroll attempt ${scrollAttempts}: height ${currentHeight}`);

      if (currentHeight === lastHeight) {
        stableCount++;
        if (stableCount >= maxStableChecks) {
          console.log('Window scrolling complete');
          clearInterval(scrollInterval);
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }

      // Scroll window to bottom
      window.scrollTo(0, document.body.scrollHeight);

      if (scrollAttempts >= maxScrollAttempts) {
        console.log('Max window scroll attempts reached');
        clearInterval(scrollInterval);
        resolve();
        return;
      }
    }, 300);

    setTimeout(() => {
      console.log('Window scroll timeout');
      clearInterval(scrollInterval);
      resolve();
    }, 8000);
  });
}

// Export functions for use in other modules
window.DocTailorJobHandlers = {
  openAllJobLinks,
  scrollToLoadAllJobs
};
