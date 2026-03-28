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

// Run on page load
document.addEventListener('DOMContentLoaded', initSabiDock);

// Run on window resize (to keep pill aligned)
window.addEventListener('resize', initSabiDock);
