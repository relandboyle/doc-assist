// Cross-browser storage namespace
const api = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_ORIGIN = 'https://doc-tailor.com';

function extractJobContext() {
  let name = '';
  let title = '';
  const pick = (sel, root) => (root || document).querySelector(sel);
  const poster = pick('.jobs-poster__name');
  if (poster) {
    const strong = pick('strong', poster);
    if (strong && strong.textContent) {
      name = String(strong.textContent).trim();
    }
  }
  const info = pick('.hirer-card__hirer-information');
  if (info) {
    const small = pick('.text-body-small', info);
    const raw = (small && small.textContent) ? String(small.textContent) : '';
    const parts = raw.split('\n');
    const line = parts.length > 1 ? parts[1] : '';
    title = line ? line.replace(/^\s+/, '') : '';
  }
  const jobUrl = location.href;
  const params = { jobUrl };
  if (name && title) {
    params.hiringName = name;
    params.hiringTitle = title;
  }
  return params;
}

function getStore() {
  try {
    return (api.storage && api.storage.sync) || api.storage.local;
  } catch (e) {
    return { get: (d, cb) => cb(d), set: (_d, cb) => cb && cb() };
  }
}

function getAppOrigin() {
  return new Promise((resolve) => {
    try {
      getStore().get({ appOrigin: DEFAULT_ORIGIN }, (res) => {
        const origin = (res && res.appOrigin) || DEFAULT_ORIGIN;
        resolve(origin);
      });
    } catch (e) {
      resolve(DEFAULT_ORIGIN);
    }
  });
}

function createFAB() {
  const fab = document.createElement('div');
  fab.id = 'doc-tailor-fab';
  fab.setAttribute('aria-label', 'Doc Tailor');
  fab.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    cursor: pointer;
    z-index: 10000;
    transition: all 0.2s ease;
  `;

  // Hover effect
  fab.addEventListener('mouseenter', () => {
    fab.style.transform = 'scale(1.05)';
  });

  fab.addEventListener('mouseleave', () => {
    fab.style.transform = 'scale(1)';
  });

  // Doc Tailor icon - fills entire button area
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('icon.png');
  icon.setAttribute('width', '56');
  icon.setAttribute('height', '56');
  icon.setAttribute('aria-hidden', 'true');
  icon.style.objectFit = 'contain';
  icon.style.borderRadius = '8px';
  icon.style.border = '1px solid #66666683';
  icon.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';

  // Fallback to SVG if image fails to load
  icon.onerror = () => {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgIcon = document.createElementNS(svgNS, 'svg');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('width', '56');
    svgIcon.setAttribute('height', '56');
    svgIcon.setAttribute('aria-hidden', 'true');
    svgIcon.style.fill = 'oklch(0.2 0.01 195)';
    svgIcon.style.backgroundColor = 'oklch(0.98 0.01 195)';
    svgIcon.style.borderRadius = '8px';
    svgIcon.style.border = '1px solid #666';
    svgIcon.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M14 3h7v7h-2V7.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z M5 5h6v2H7v10h10v-4h2v6H5V5z');
    svgIcon.appendChild(path);

    fab.replaceChild(svgIcon, icon);
  };

  fab.appendChild(icon);

  return fab;
}

function createFlyout() {
  const flyout = document.createElement('div');
  flyout.id = 'doc-tailor-flyout';
  flyout.style.cssText = `
    position: fixed;
    top: 86px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    min-width: 200px;
    z-index: 10001;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.2s ease;
    pointer-events: none;
  `;

  // First menu item - Open Doc Tailor
  const openMenuItem = document.createElement('button');
  openMenuItem.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: oklch(0.2 0.01 195);
    transition: background-color 0.1s ease;
  `;

  openMenuItem.addEventListener('mouseenter', () => {
    openMenuItem.style.backgroundColor = 'oklch(0.95 0.01 195)';
  });

  openMenuItem.addEventListener('mouseleave', () => {
    openMenuItem.style.backgroundColor = 'transparent';
  });

  // External link icon for first menu item
  const svgNS = 'http://www.w3.org/2000/svg';
  const externalIcon = document.createElementNS(svgNS, 'svg');
  externalIcon.setAttribute('viewBox', '0 0 24 24');
  externalIcon.setAttribute('width', '16');
  externalIcon.setAttribute('height', '16');
  externalIcon.setAttribute('aria-hidden', 'true');
  externalIcon.style.fill = 'oklch(0.2 0.01 195)';

  const externalPath = document.createElementNS(svgNS, 'path');
  externalPath.setAttribute('d', 'M14 3h7v7h-2V7.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z M5 5h6v2H7v10h10v-4h2v6H5V5z');
  externalIcon.appendChild(externalPath);

  const openLabel = document.createElement('span');
  openLabel.textContent = 'Open Doc Tailor';

  openMenuItem.appendChild(externalIcon);
  openMenuItem.appendChild(openLabel);
  flyout.appendChild(openMenuItem);

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = `
    height: 1px;
    background: #e0e0e0;
    margin: 4px 0;
  `;
  flyout.appendChild(divider);

  // Second menu item - Change Position
  const positionMenuItem = document.createElement('button');
  positionMenuItem.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: oklch(0.2 0.01 195);
    transition: background-color 0.1s ease;
  `;

  positionMenuItem.addEventListener('mouseenter', () => {
    positionMenuItem.style.backgroundColor = 'oklch(0.95 0.01 195)';
  });

  positionMenuItem.addEventListener('mouseleave', () => {
    // Only clear background if not hovering submenu
    setTimeout(() => {
      const submenu = document.getElementById('doc-tailor-position-submenu');
      if (!submenu || submenu.style.opacity === '0') {
        positionMenuItem.style.backgroundColor = 'transparent';
      }
    }, 50);
  });

  // Position icon
  const positionIcon = document.createElementNS(svgNS, 'svg');
  positionIcon.setAttribute('viewBox', '0 0 24 24');
  positionIcon.setAttribute('width', '16');
  positionIcon.setAttribute('height', '16');
  positionIcon.setAttribute('aria-hidden', 'true');
  positionIcon.style.fill = 'oklch(0.2 0.01 195)';

  const positionPath = document.createElementNS(svgNS, 'path');
  positionPath.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
  positionIcon.appendChild(positionPath);

  const positionLabel = document.createElement('span');
  positionLabel.textContent = 'Change Position';

  positionMenuItem.appendChild(positionIcon);
  positionMenuItem.appendChild(positionLabel);
  flyout.appendChild(positionMenuItem);

  // Divider
  const divider2 = document.createElement('div');
  divider2.style.cssText = `
    height: 1px;
    background: #e0e0e0;
    margin: 4px 0;
  `;
  flyout.appendChild(divider2);

  // Third menu item - Guide
  const guideMenuItem = document.createElement('button');
  guideMenuItem.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: oklch(0.2 0.01 195);
    transition: background-color 0.1s ease;
  `;

  guideMenuItem.addEventListener('mouseenter', () => {
    guideMenuItem.style.backgroundColor = 'oklch(0.95 0.01 195)';
  });

  guideMenuItem.addEventListener('mouseleave', () => {
    guideMenuItem.style.backgroundColor = 'transparent';
  });

  // Guide icon
  const guideIcon = document.createElementNS(svgNS, 'svg');
  guideIcon.setAttribute('viewBox', '0 0 24 24');
  guideIcon.setAttribute('width', '16');
  guideIcon.setAttribute('height', '16');
  guideIcon.setAttribute('aria-hidden', 'true');
  guideIcon.style.fill = 'oklch(0.2 0.01 195)';

  const guidePath = document.createElementNS(svgNS, 'path');
  guidePath.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z');
  guideIcon.appendChild(guidePath);

  const guideLabel = document.createElement('span');
  guideLabel.textContent = 'Setup Guide';

  guideMenuItem.appendChild(guideIcon);
  guideMenuItem.appendChild(guideLabel);
  flyout.appendChild(guideMenuItem);

  // Guide menu item click
  guideMenuItem.addEventListener('click', () => {
    window.open('https://www.doc-tailor.com/guide', '_blank', 'noopener');
    hideFlyout();
  });

  // Create position submenu
  const positionSubmenu = createPositionSubmenu();
  positionMenuItem.appendChild(positionSubmenu);

  // Add hover events for submenu
  let submenuHoverTimeout = null;
  let submenuShowTimeout = null;

  positionMenuItem.addEventListener('mouseenter', () => {
    if (submenuHoverTimeout) {
      clearTimeout(submenuHoverTimeout);
      submenuHoverTimeout = null;
    }
    if (submenuShowTimeout) {
      clearTimeout(submenuShowTimeout);
    }
    submenuShowTimeout = setTimeout(() => {
      showPositionSubmenu();
    }, 200);
  });

  positionMenuItem.addEventListener('mouseleave', () => {
    if (submenuShowTimeout) {
      clearTimeout(submenuShowTimeout);
      submenuShowTimeout = null;
    }
    submenuHoverTimeout = setTimeout(() => {
      hidePositionSubmenu();
    }, 200);
  });

  positionSubmenu.addEventListener('mouseenter', () => {
    if (submenuHoverTimeout) {
      clearTimeout(submenuHoverTimeout);
      submenuHoverTimeout = null;
    }
    if (submenuShowTimeout) {
      clearTimeout(submenuShowTimeout);
      submenuShowTimeout = null;
    }
    showPositionSubmenu();
  });

  positionSubmenu.addEventListener('mouseleave', () => {
    submenuHoverTimeout = setTimeout(() => {
      hidePositionSubmenu();
    }, 200);
  });

  return { flyout, openMenuItem, positionMenuItem };
}

let fab, flyout, openMenuItem, positionMenuItem, isOpen = false;
let currentPosition = 'top-right'; // Default position
let hoverTimeout = null;

function showFlyout() {
  if (!flyout) return;
  flyout.style.opacity = '1';
  flyout.style.transform = 'translateY(0)';
  flyout.style.pointerEvents = 'auto';
  isOpen = true;
}

function hideFlyout() {
  if (!flyout) return;
  flyout.style.opacity = '0';
  flyout.style.transform = 'translateY(-10px)';
  flyout.style.pointerEvents = 'none';
  isOpen = false;
}

function updateFABPosition(position) {
  if (!fab) return;

  const positions = {
    'top-left': { top: '20px', left: '20px', right: 'auto' },
    'top-right': { top: '20px', right: '20px', left: 'auto' },
    'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' },
    'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' }
  };

  const pos = positions[position];
  if (pos) {
    Object.assign(fab.style, pos);
    currentPosition = position;

    // Save position to storage
    try {
      getStore().set({ fabPosition: position }, () => {});
    } catch (e) {
      console.log('Failed to save FAB position:', e);
    }

    // Update flyout position relative to FAB
    updateFlyoutPosition();
  }
}

function updateFlyoutPosition() {
  if (!flyout) return;

  const positions = {
    'top-left': { top: '86px', left: '20px', right: 'auto', bottom: 'auto' },
    'top-right': { top: '86px', right: '20px', left: 'auto', bottom: 'auto' },
    'bottom-left': { bottom: '86px', left: '20px', top: 'auto', right: 'auto' },
    'bottom-right': { bottom: '86px', right: '20px', top: 'auto', left: 'auto' }
  };

  const pos = positions[currentPosition];
  if (pos) {
    Object.assign(flyout.style, pos);

    // Adjust submenu position based on screen boundaries
    const submenu = document.getElementById('doc-tailor-position-submenu');
    if (submenu) {
      updateSubmenuPosition(submenu);
    }
  }
}

function updateSubmenuPosition(submenu) {
  if (!submenu || !flyout) return;

  const flyoutRect = flyout.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const submenuWidth = 150; // min-width from CSS

  // Check if submenu would go off-screen to the right
  const wouldOverflowRight = flyoutRect.right + submenuWidth + 4 > viewportWidth;

  if (wouldOverflowRight) {
    // Position submenu to the left of the flyout
    submenu.style.left = 'auto';
    submenu.style.right = '100%';
    submenu.style.marginLeft = '0';
    submenu.style.marginRight = '4px';
    submenu.style.transform = 'translateX(10px)';
  } else {
    // Position submenu to the right of the flyout (default)
    submenu.style.left = '100%';
    submenu.style.right = 'auto';
    submenu.style.marginLeft = '4px';
    submenu.style.marginRight = '0';
    submenu.style.transform = 'translateX(-10px)';
  }
}

function createPositionSubmenu() {
  const submenu = document.createElement('div');
  submenu.id = 'doc-tailor-position-submenu';
  submenu.style.cssText = `
    position: absolute;
    top: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    min-width: 150px;
    z-index: 10002;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.2s ease;
    pointer-events: none;
  `;

  const positions = [
    { key: 'top-left', label: 'Top Left' },
    { key: 'top-right', label: 'Top Right' },
    { key: 'bottom-left', label: 'Bottom Left' },
    { key: 'bottom-right', label: 'Bottom Right' }
  ];

  positions.forEach(pos => {
    const button = document.createElement('button');
    button.textContent = pos.label;
    button.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: ${pos.key === currentPosition ? 'oklch(0.95 0.01 195)' : 'transparent'};
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      color: oklch(0.2 0.01 195);
      transition: background-color 0.1s ease;
    `;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      hidePositionSubmenu();
      hideFlyout();
      // Small delay to ensure flyout closes before FAB moves
      setTimeout(() => {
        updateFABPosition(pos.key);
      }, 100);
    });

    button.addEventListener('mouseenter', () => {
      // Clear all other button highlights first
      const allButtons = submenu.querySelectorAll('button');
      allButtons.forEach(btn => {
        if (btn !== button) {
          btn.style.backgroundColor = 'transparent';
        }
      });

      if (pos.key !== currentPosition) {
        button.style.backgroundColor = 'oklch(0.95 0.01 195)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (pos.key !== currentPosition) {
        button.style.backgroundColor = 'transparent';
      }
    });

    submenu.appendChild(button);
  });

  return submenu;
}

function showPositionSubmenu() {
  const submenu = document.getElementById('doc-tailor-position-submenu');
  if (submenu) {
    // Update position before showing
    updateSubmenuPosition(submenu);
    submenu.style.opacity = '1';
    submenu.style.pointerEvents = 'auto';
    submenu.style.transform = 'translateX(0)';
  }
}

function hidePositionSubmenu() {
  const submenu = document.getElementById('doc-tailor-position-submenu');
  if (submenu) {
    submenu.style.opacity = '0';
    submenu.style.pointerEvents = 'none';

    // Animate based on current position
    const isLeftPositioned = submenu.style.right === '100%';
    submenu.style.transform = isLeftPositioned ? 'translateX(10px)' : 'translateX(-10px)';
  }
}

async function openDocTailor() {
  const appOrigin = await getAppOrigin();
  const params = extractJobContext();
  const qs = new URLSearchParams(params).toString();
  const url = appOrigin.replace(/\/+$/, '') + '/dashboard/builder?' + qs;
  window.open(url, '_blank', 'noopener');
}

async function loadSavedPosition() {
  return new Promise((resolve) => {
    try {
      getStore().get({ fabPosition: 'top-right' }, (res) => {
        const savedPosition = (res && res.fabPosition) || 'top-right';
        resolve(savedPosition);
      });
    } catch (e) {
      resolve('top-right');
    }
  });
}

async function setupFAB() {
  if (document.getElementById('doc-tailor-fab')) return;

  // Load saved position
  const savedPosition = await loadSavedPosition();
  currentPosition = savedPosition;

  fab = createFAB();
  const { flyout: f, openMenuItem: om, positionMenuItem: pm } = createFlyout();
  flyout = f;
  openMenuItem = om;
  positionMenuItem = pm;

  // Apply saved position
  updateFABPosition(savedPosition);

  document.body.appendChild(fab);
  document.body.appendChild(flyout);

  // FAB click to open Doc Tailor directly
  fab.addEventListener('click', async (e) => {
    e.stopPropagation();
    await openDocTailor();
  });

  // FAB hover to show flyout after delay
  fab.addEventListener('mouseenter', () => {
    hoverTimeout = setTimeout(() => {
      showFlyout();
    }, 1500);
  });

  fab.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    // Don't hide flyout immediately on mouse leave - let user interact with it
  });

  // FAB right-click to show flyout immediately
  fab.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showFlyout();
  });

  // Open Doc Tailor menu item click
  openMenuItem.addEventListener('click', async () => {
    await openDocTailor();
    hideFlyout();
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (isOpen && !fab.contains(e.target) && !flyout.contains(e.target)) {
      hideFlyout();
    }
  });
}

function isJobViewPage() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Check if we're on a LinkedIn job view page
  // Pattern: /jobs/view/1234567890/ or /jobs/view/1234567890
  return pathname.match(/^\/jobs\/view\/\d+\/?$/);
}

function setup() {
  // Only setup FAB on job view pages
  if (isJobViewPage()) {
    setupFAB();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}


