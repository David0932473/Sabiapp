function initSabiDock() {
    const indicator = document.getElementById('nav-indicator');
    const activeTab = document.querySelector('.nav-item.active');

    if (activeTab && indicator) {
        // Calculate the position and width of the active item
        const tabWidth = activeTab.offsetWidth;
        const tabLeft = activeTab.offsetLeft;

        // Move the indicator pill
        indicator.style.width = `${tabWidth}px`;
        indicator.style.left = `${tabLeft}px`;
        
        // Initial entrance "pop" animation
        indicator.style.transform = 'scale(1.1)';
        setTimeout(() => {
            indicator.style.transform = 'scale(1)';
        }, 400);
    }
}

// Auto-hide Bottom Dock smoothly on scroll
function initDockScrollListener() {
    const dock = document.querySelector('.app-bottom-nav');
    if (!dock) return;

    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let ticking = false;
    const threshold = 8; // Minimum delta to filter micro-jitters

    function onScrollUpdate(currentY, maxScroll) {
        // Always show dock at the very top
        if (currentY <= 15) {
            dock.classList.remove('nav-hidden');
            document.body.classList.remove('nav-is-hidden');
            lastScrollY = currentY;
            return;
        }

        // Avoid hiding when bouncing at the bottom of the page on iOS rubber-band
        if (maxScroll && currentY >= maxScroll - 20) {
            lastScrollY = currentY;
            return;
        }

        const delta = currentY - lastScrollY;

        if (Math.abs(delta) > threshold) {
            if (delta > 0) {
                // Scrolling down -> slowly glide dock down out of view
                dock.classList.add('nav-hidden');
                document.body.classList.add('nav-is-hidden');
            } else {
                // Scrolling up -> gently bring dock back into view
                dock.classList.remove('nav-hidden');
                document.body.classList.remove('nav-is-hidden');
            }
            lastScrollY = currentY;
        }
    }

    // 1. Listen to global window scrolling
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                onScrollUpdate(currentY, maxScroll);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // 2. Also listen to nested scrollable containers (e.g. Day timeline scroll in calendar)
    function attachContainerScroll(container) {
        if (!container || container._hasDockScrollListener) return;
        container._hasDockScrollListener = true;
        let lastInnerY = container.scrollTop;
        let innerTicking = false;

        container.addEventListener('scroll', () => {
            if (!innerTicking) {
                window.requestAnimationFrame(() => {
                    const currentInnerY = container.scrollTop;
                    const maxInnerScroll = container.scrollHeight - container.clientHeight;
                    onScrollUpdate(currentInnerY, maxInnerScroll);
                    innerTicking = false;
                });
                innerTicking = true;
            }
        }, { passive: true });
    }

    const checkContainers = () => {
        const timeline = document.getElementById('day-timeline-scroll') || document.querySelector('.day-timeline-scroll');
        if (timeline) attachContainerScroll(timeline);
    };

    checkContainers();
    setTimeout(checkContainers, 600);

    // Watch for dynamically rendered timeline containers
    const observer = new MutationObserver(() => checkContainers());
    observer.observe(document.body, { childList: true, subtree: true });
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    initSabiDock();
    initDockScrollListener();
    applySabiTheme();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(initSabiDock);
    }
});

// Run on window resize (to keep pill aligned)
window.addEventListener('resize', initSabiDock);

// Interactive placeholder handler for Friends tab
let friendsToastTimeout = null;
function showFriendsPlaceholder(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const toast = document.getElementById('liquid-glass-toast');
    const friendsBtn = document.getElementById('nav-item-friends');

    if (friendsBtn) {
        friendsBtn.style.transform = 'scale(0.92)';
        setTimeout(() => {
            friendsBtn.style.transform = '';
        }, 180);
    }

    if (!toast) return;

    if (friendsToastTimeout) {
        clearTimeout(friendsToastTimeout);
    }

    toast.classList.remove('hidden');

    friendsToastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3400);
}

// Theme Initialization & Sync
function applySabiTheme(themeName) {
    const theme = themeName || localStorage.getItem('sabi_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// Immediate execution to prevent flash of wrong theme
applySabiTheme();

