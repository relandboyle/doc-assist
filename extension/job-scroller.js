// Job Scroller Module for Doc Tailor Extension
// Handles scrolling functionality to load all lazy-loaded job links

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
    const maxScrollAttempts = 30; // Increased for up/down scrolling
    let scrollDirection = 'up'; // Start by scrolling up
    let upScrollComplete = false;

    const scrollInterval = setInterval(() => {
      scrollAttempts++;
      const currentHeight = resultsContainer.scrollHeight;

      console.log(`Scroll attempt ${scrollAttempts}: height ${currentHeight}, lastHeight ${lastHeight}, direction: ${scrollDirection}`);

      if (currentHeight === lastHeight) {
        stableCount++;
        console.log(`Height stable for ${stableCount} checks`);

        // If we're scrolling up and height is stable, switch to down scrolling
        if (scrollDirection === 'up' && !upScrollComplete) {
          console.log('Up scrolling complete, switching to down scrolling');
          scrollDirection = 'down';
          upScrollComplete = true;
          stableCount = 0; // Reset stable count for down scrolling
          lastHeight = currentHeight; // Update last height
        } else if (scrollDirection === 'down' && stableCount >= maxStableChecks) {
          console.log('Down scrolling complete - height stable');
          clearInterval(scrollInterval);
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
        console.log('Height changed, continuing to scroll');
      }

      // Scroll based on direction
      if (scrollDirection === 'up') {
        // Scroll to top
        resultsContainer.scrollTop = 0;
        resultsContainer.scrollTo(0, 0);
        window.scrollTo(0, 0);
      } else {
        // Scroll to bottom
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
        resultsContainer.scrollTo(0, resultsContainer.scrollHeight);
        window.scrollTo(0, document.body.scrollHeight);
      }

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
    const maxScrollAttempts = 30; // Increased for up/down scrolling
    let scrollDirection = 'up'; // Start by scrolling up
    let upScrollComplete = false;

    const scrollInterval = setInterval(() => {
      scrollAttempts++;
      const currentHeight = document.body.scrollHeight;

      console.log(`Window scroll attempt ${scrollAttempts}: height ${currentHeight}, direction: ${scrollDirection}`);

      if (currentHeight === lastHeight) {
        stableCount++;
        console.log(`Window height stable for ${stableCount} checks`);

        // If we're scrolling up and height is stable, switch to down scrolling
        if (scrollDirection === 'up' && !upScrollComplete) {
          console.log('Window up scrolling complete, switching to down scrolling');
          scrollDirection = 'down';
          upScrollComplete = true;
          stableCount = 0; // Reset stable count for down scrolling
          lastHeight = currentHeight; // Update last height
        } else if (scrollDirection === 'down' && stableCount >= maxStableChecks) {
          console.log('Window down scrolling complete');
          clearInterval(scrollInterval);
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
        console.log('Window height changed, continuing to scroll');
      }

      // Scroll based on direction
      if (scrollDirection === 'up') {
        // Scroll window to top
        window.scrollTo(0, 0);
      } else {
        // Scroll window to bottom
        window.scrollTo(0, document.body.scrollHeight);
      }

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
window.DocTailorJobScroller = {
  scrollToLoadAllJobs,
  scrollWindowToLoadJobs
};
