// Job Handlers Module for Doc Tailor Extension
// Handles job search functionality and opening job links

async function openAllJobLinks() {
  // First, scroll to the bottom to load all lazy-loaded job links
  await scrollToLoadAllJobs();

  // Wait a bit for any final lazy loading to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find all job links
  const jobLinks = document.querySelectorAll('a.job-card-container__link');

  if (jobLinks.length === 0) {
    console.log('No job links found');
    return;
  }

  // LinkedIn typically limits to around 20 tabs, so we'll respect that limit
  const maxTabs = 20;
  const linksToOpen = Array.from(jobLinks).slice(0, maxTabs);

  console.log(`Found ${jobLinks.length} job links, opening first ${linksToOpen.length} (LinkedIn tab limit: ${maxTabs})...`);

  // Show user feedback about the operation
  console.log(`Note: LinkedIn limits tab opening to ${maxTabs} tabs. ${jobLinks.length - maxTabs} additional jobs were not opened.`);

  // Show modal summary immediately
  showJobOpeningSummary(jobLinks.length, linksToOpen.length, maxTabs);

  // Open each job link in a new tab (simulating middle-click behavior)
  linksToOpen.forEach((link, index) => {
    // Add a 300ms delay between each click to avoid overwhelming the browser
    setTimeout(() => {
      const href = link.getAttribute('href');
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
    const resultsContainer = document.querySelector('.scaffold-layout__list');
    if (!resultsContainer) {
      console.log('Results container not found');
      resolve();
      return;
    }

    let lastHeight = 0;
    let stableCount = 0;
    const maxStableChecks = 3; // Stop after 3 consecutive stable checks

    const scrollInterval = setInterval(() => {
      const currentHeight = resultsContainer.scrollHeight;

      if (currentHeight === lastHeight) {
        stableCount++;
        if (stableCount >= maxStableChecks) {
          clearInterval(scrollInterval);
          resolve();
          return;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }

      // Scroll to bottom
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }, 500);

    // Fallback timeout
    setTimeout(() => {
      clearInterval(scrollInterval);
      resolve();
    }, 10000); // 10 second timeout
  });
}

// Export functions for use in other modules
window.DocTailorJobHandlers = {
  openAllJobLinks,
  scrollToLoadAllJobs
};
