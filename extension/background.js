// Background Script for Doc Tailor Extension
// Handles tab positioning using Chrome Tabs API

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createDocTailorTab') {
    handleCreateDocTailorTab(request, sender, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'createDocTailorTabAtEnd') {
    handleCreateDocTailorTabAtEnd(request, sender, sendResponse);
    return true;
  } else if (request.action === 'moveDocTailorTab') {
    handleMoveDocTailorTab(request, sender, sendResponse);
    return true;
  } else if (request.action === 'extractJobContextFromTab') {
    handleExtractJobContextFromTab(request, sender, sendResponse);
    return true;
  }
});

async function handleCreateDocTailorTab(request, sender, sendResponse) {
  try {
    const { url, tabIndex } = request;

    console.log(`Background: Creating Doc-Tailor tab for job ${tabIndex}`);

    // Get all tabs in the current window
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    console.log(`Background: Found ${allTabs.length} tabs in current window`);

    // Debug: Log all LinkedIn tabs
    const linkedinTabs = allTabs.filter(tab =>
      tab.url && tab.url.includes('linkedin.com/jobs/view/')
    );
    console.log(`Background: Found ${linkedinTabs.length} LinkedIn job tabs`);
    linkedinTabs.forEach((tab, index) => {
      console.log(`Background: LinkedIn tab ${index}: index=${tab.index}, url=${tab.url}`);
    });

    // Find the LinkedIn tab with the matching tabIndex
    // First try to find by tabIndex parameter
    let linkedinTab = allTabs.find(tab =>
      tab.url && tab.url.includes('linkedin.com/jobs/view/') &&
      tab.url.includes(`tabIndex=${tabIndex}`)
    );

    // If not found by tabIndex parameter, try to find by position
    // The LinkedIn tab should be at a position that corresponds to the tabIndex
    if (!linkedinTab) {
      console.log(`Background: Could not find LinkedIn tab with tabIndex parameter, trying position-based search`);

      // Since LinkedIn tabs are opened sequentially, we can estimate the position
      // LinkedIn tabs should be at even indices (0, 2, 4, 6, 8, 10, 12, etc.)
      // and Doc-Tailor tabs at odd indices (1, 3, 5, 7, 9, 11, 13, etc.)
      const estimatedLinkedInIndex = (parseInt(tabIndex) - 1) * 2;

      if (estimatedLinkedInIndex < allTabs.length) {
        const candidateTab = allTabs[estimatedLinkedInIndex];
        if (candidateTab && candidateTab.url && candidateTab.url.includes('linkedin.com/jobs/view/')) {
          linkedinTab = candidateTab;
          console.log(`Background: Found LinkedIn tab at estimated position ${estimatedLinkedInIndex}`);
        }
      }
    }

    if (linkedinTab) {
      // Create the Doc-Tailor tab at the position right after the LinkedIn tab
      const targetIndex = linkedinTab.index + 1;
      console.log(`Background: Creating Doc-Tailor tab at index ${targetIndex} (after LinkedIn tab at index ${linkedinTab.index})`);

      const newTab = await chrome.tabs.create({
        url: url,
        index: targetIndex,
        active: false
      });

      console.log(`Background: Doc-Tailor tab created at correct position for job ${tabIndex}`);
      sendResponse({ success: true, tabId: newTab.id });
    } else {
      console.log(`Background: Could not find LinkedIn tab with tabIndex ${tabIndex}`);
      sendResponse({ success: false, error: 'LinkedIn tab not found' });
    }
  } catch (error) {
    console.error('Background: Error positioning Doc-Tailor tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCreateDocTailorTabAtEnd(request, sender, sendResponse) {
  try {
    const { url, tabIndex } = request;

    console.log(`Background: Creating Doc-Tailor tab at end for job ${tabIndex}`);

    // Create the Doc-Tailor tab at the end (default position)
    const newTab = await chrome.tabs.create({
      url: url,
      active: false
    });

    console.log(`Background: Doc-Tailor tab created at end with ID ${newTab.id}`);
    sendResponse({ success: true, tabId: newTab.id });
  } catch (error) {
    console.error('Background: Error creating Doc-Tailor tab at end:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleMoveDocTailorTab(request, sender, sendResponse) {
  try {
    const { docTailorTabId, linkedInTabIndex } = request;

    console.log(`Background: Moving Doc-Tailor tab ${docTailorTabId} after LinkedIn tab ${linkedInTabIndex}`);

    // Get all tabs in the current window
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Find the LinkedIn tab with the matching tabIndex
    let linkedinTab = allTabs.find(tab =>
      tab.url && tab.url.includes('linkedin.com/jobs/view/') &&
      tab.url.includes(`tabIndex=${linkedInTabIndex}`)
    );

    // If not found by tabIndex parameter, try position-based search
    if (!linkedinTab) {
      console.log(`Background: Could not find LinkedIn tab with tabIndex parameter, trying position-based search`);
      const estimatedLinkedInIndex = (parseInt(linkedInTabIndex) - 1) * 2;

      if (estimatedLinkedInIndex < allTabs.length) {
        const candidateTab = allTabs[estimatedLinkedInIndex];
        if (candidateTab && candidateTab.url && candidateTab.url.includes('linkedin.com/jobs/view/')) {
          linkedinTab = candidateTab;
          console.log(`Background: Found LinkedIn tab at estimated position ${estimatedLinkedInIndex}`);
        }
      }
    }

    if (linkedinTab) {
      // Move the Doc-Tailor tab to the position right after the LinkedIn tab
      const targetIndex = linkedinTab.index + 1;
      console.log(`Background: Moving Doc-Tailor tab to index ${targetIndex} (after LinkedIn tab at index ${linkedinTab.index})`);

      await chrome.tabs.move(docTailorTabId, { index: targetIndex });

      console.log(`Background: Doc-Tailor tab moved to correct position for job ${linkedInTabIndex}`);
      sendResponse({ success: true });
    } else {
      console.log(`Background: Could not find LinkedIn tab with tabIndex ${linkedInTabIndex}`);
      sendResponse({ success: false, error: 'LinkedIn tab not found' });
    }
  } catch (error) {
    console.error('Background: Error moving Doc-Tailor tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExtractJobContextFromTab(request, sender, sendResponse) {
  try {
    const { tabIndex } = request;

    console.log(`Background: Extracting job context from LinkedIn tab ${tabIndex}`);

    // Get all tabs in the current window
    const allTabs = await chrome.tabs.query({ currentWindow: true });

    // Find the LinkedIn tab with the matching tabIndex
    let linkedinTab = allTabs.find(tab =>
      tab.url && tab.url.includes('linkedin.com/jobs/view/') &&
      tab.url.includes(`tabIndex=${tabIndex}`)
    );

    // If not found by tabIndex parameter, try position-based search
    if (!linkedinTab) {
      console.log(`Background: Could not find LinkedIn tab with tabIndex parameter, trying position-based search`);
      const estimatedLinkedInIndex = (parseInt(tabIndex) - 1) * 2;

      if (estimatedLinkedInIndex < allTabs.length) {
        const candidateTab = allTabs[estimatedLinkedInIndex];
        if (candidateTab && candidateTab.url && candidateTab.url.includes('linkedin.com/jobs/view/')) {
          linkedinTab = candidateTab;
          console.log(`Background: Found LinkedIn tab at estimated position ${estimatedLinkedInIndex}`);
        }
      }
    }

    if (linkedinTab) {
      console.log(`Background: Found LinkedIn tab ${linkedinTab.id}, extracting job context`);

      // Execute the job context extraction script in the LinkedIn tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: linkedinTab.id },
        func: extractJobContextFromPage
      });

      if (results && results[0] && results[0].result) {
        console.log(`Background: Job context extracted successfully for tab ${tabIndex}`);
        sendResponse({ success: true, data: results[0].result });
      } else {
        console.log(`Background: Failed to extract job context from tab ${tabIndex}`);
        sendResponse({ success: false, error: 'Failed to extract job context' });
      }
    } else {
      console.log(`Background: Could not find LinkedIn tab with tabIndex ${tabIndex}`);
      sendResponse({ success: false, error: 'LinkedIn tab not found' });
    }
  } catch (error) {
    console.error('Background: Error extracting job context from tab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to extract job context from a LinkedIn job page
function extractJobContextFromPage() {
  // This function runs in the context of the LinkedIn job page
  // Extract job information from the page
  const jobTitle = document.querySelector('h1.job-title, .job-details-jobs-unified-top-card__job-title, h1')?.textContent?.trim() || '';
  const companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name a')?.textContent?.trim() || '';
  const location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim() || '';
  const jobDescription = document.querySelector('.jobs-description-content__text, .jobs-box__html-content, .jobs-description')?.textContent?.trim() || '';

  return {
    jobTitle: jobTitle,
    companyName: companyName,
    location: location,
    jobDescription: jobDescription,
    jobUrl: window.location.href
  };
}
