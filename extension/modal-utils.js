// Modal Utils Module for Doc Tailor Extension
// Handles modal display functionality for job opening summaries

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

function showDocTailorOpeningSummary(totalJobs, openedJobs, maxTabs) {
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
  title.textContent = 'Doc-Tailor Import Summary';
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
      <p><strong>Opening ${openedJobs} jobs in Doc-Tailor</strong> for processing.</p>
      <p style="color: #f59e0b; font-weight: 500;">⚠️ LinkedIn limits tab opening to ${maxTabs} tabs at once.</p>
      <p style="color: #666; font-size: 14px;">${totalJobs - openedJobs} additional jobs were not opened due to this limitation.</p>
    `;
  } else {
    summary.innerHTML = `
      <p><strong>Found ${totalJobs} job postings</strong> in the search results.</p>
      <p><strong>Successfully opening all ${openedJobs} jobs in Doc-Tailor</strong> for processing.</p>
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
    <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0a66c2;">💡 Doc-Tailor Tips:</h4>
    <ul style="margin: 0; padding-left: 16px; font-size: 14px; color: #666;">
      <li>Each job will open in a new tab and automatically load in Doc-Tailor</li>
      <li>Use Doc-Tailor's Document Builder to create tailored applications</li>
      <li>Close some tabs and try again to process more jobs</li>
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

// Export functions for use in other modules
window.DocTailorModalUtils = {
  showJobOpeningSummary,
  showDocTailorOpeningSummary
};
