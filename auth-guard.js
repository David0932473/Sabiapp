/**
 * Sabi OS Route Guard & User Session Bar (auth-guard.js)
 * Protects pages and renders user profile / logout controls.
 */

(async function () {
    // If we're already on auth.html, do nothing
    if (window.location.pathname.endsWith('auth.html')) return;

    // Ensure Supabase SDK & SabiAuth are loaded
    if (!window.SabiAuth) {
        console.warn('[AUTH-GUARD] Waiting for SabiAuth...');
        return;
    }

    try {
        const session = await SabiAuth.getSession();

        if (!session || !session.user) {
            // User is not logged in: Store current path and redirect to auth.html
            sessionStorage.setItem('sabi_redirect_url', window.location.href);
            window.location.replace('auth.html');
            return;
        }

        const user = session.user;
        const profile = await SabiAuth.fetchAndCacheProfile(user.id);

        // Check if user needs onboarding
        const needsOnboarding = await SabiAuth.needsOnboarding();
        if (needsOnboarding) {
            window.location.replace('auth.html?onboarding=true');
            return;
        }

        // Apply profile data to the page UI
        document.addEventListener('DOMContentLoaded', () => {
            setupUserProfileUI(user, profile);
        });

        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            setupUserProfileUI(user, profile);
        }

    } catch (err) {
        console.error('[AUTH-GUARD] Session check failed:', err);
    }

    function setupUserProfileUI(user, profile) {
        const fullName = (profile && profile.full_name) || user.user_metadata?.full_name || 'Scholar';
        const firstName = fullName.split(' ')[0];
        const studyTrack = profile?.study_mode === 'university'
            ? `${profile.university || 'University'} • ${profile.level || 'Student'}`
            : 'Sabi Scholar';

        // 1. Update greeting if element exists
        const greetingEl = document.getElementById('greeting-text') || document.querySelector('.slogan-mini');
        if (greetingEl && !greetingEl.dataset.authSet) {
            greetingEl.dataset.authSet = "true";
            const hour = new Date().getHours();
            let timeGreeting = "Good morning";
            if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
            if (hour >= 17) timeGreeting = "Good evening";
            greetingEl.innerHTML = `${timeGreeting}, <span class="blue-s">${firstName}</span> • <span style="opacity: 0.8;">${studyTrack}</span>`;
        }

        // 2. Setup user profile avatar button & dropdown
        const profileBtn = document.querySelector('.profile-btn');
        if (profileBtn && !document.getElementById('sabi-user-menu')) {
            // Attach a dropdown menu for profile & logout
            injectUserDropdown(profileBtn, fullName, user.email, studyTrack);
        }
    }

    function injectUserDropdown(anchorBtn, name, email, track) {
        anchorBtn.style.position = 'relative';

        const menu = document.createElement('div');
        menu.id = 'sabi-user-menu';
        menu.style.cssText = `
            display: none;
            position: absolute;
            top: 56px;
            right: 0;
            width: 230px;
            background: var(--surface, #ffffff);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: 14px;
            padding: 12px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
            text-align: left;
            animation: fadeInMenu 0.18s ease-out;
        `;

        // Style animation
        const style = document.createElement('style');
        style.innerText = `
            @keyframes fadeInMenu {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .sabi-menu-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 9px 10px;
                font-size: 13px;
                font-weight: 500;
                color: var(--text-main, #0F172A);
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.15s ease;
                text-decoration: none;
                border: none;
                background: transparent;
                width: 100%;
            }
            .sabi-menu-item:hover {
                background: rgba(61, 142, 255, 0.08);
                color: #3D8EFF;
            }
            .sabi-menu-item.logout {
                color: #EF4444;
            }
            .sabi-menu-item.logout:hover {
                background: rgba(239, 68, 68, 0.08);
                color: #EF4444;
            }
        `;
        document.head.appendChild(style);

        menu.innerHTML = `
            <div style="padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--border, #E2E8F0);">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main, #0F172A); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                <div style="font-size: 11px; color: var(--text-muted, #64748B); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${email}</div>
                <div style="font-size: 10.5px; font-weight: 600; color: #3D8EFF; margin-top: 3px;">${track}</div>
            </div>
            <button type="button" class="sabi-menu-item" onclick="window.location.href='auth.html?onboarding=true'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Edit Academic Track
            </button>
            <button type="button" class="sabi-menu-item logout" onclick="SabiAuth.signOut()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
            </button>
        `;

        // Append to parent container of profile button
        anchorBtn.parentElement.style.position = 'relative';
        anchorBtn.parentElement.appendChild(menu);

        anchorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== anchorBtn) {
                menu.style.display = 'none';
            }
        });
    }

})();
