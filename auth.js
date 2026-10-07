/**
 * Sabi OS Authentication Module (auth.js)
 * Powered by Supabase Auth & Database
 */

(function (window) {
    const SUPABASE_URL = 'https://axmnhhazrjluviedaity.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bW5oaGF6cmpsdXZpZWRhaXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDc3MDUsImV4cCI6MjA5MDQ4MzcwNX0.qx1GdrgpEuqx37-ytGD2ZrG-NfpxXAvQIXPpnTwwqUg';

    let supabaseClient = null;

    function getClient() {
        if (supabaseClient) return supabaseClient;
        if (window.sabiDb) {
            supabaseClient = window.sabiDb;
            return supabaseClient;
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            window.sabiDb = supabaseClient;
            return supabaseClient;
        }
        return null;
    }

    async function ensureSupabaseLoaded() {
        if (getClient()) return getClient();
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve(getClient());
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => {
                const client = getClient();
                resolve(client);
            };
            script.onerror = () => reject(new Error('Failed to load Supabase SDK'));
            document.head.appendChild(script);
        });
    }

    const SabiAuth = {
        // Sign up with Email & Password
        async signUp(email, password, fullName) {
            const client = await ensureSupabaseLoaded();
            const { data, error } = await client.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim()
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Cache user info in localStorage for instant responsiveness
                localStorage.setItem('sabi_user_id', data.user.id);
                localStorage.setItem('sabi_user_email', data.user.email);
                if (fullName) {
                    localStorage.setItem('sabi_user_name', fullName.trim());
                }
            }

            return data;
        },

        // Sign in with Email & Password
        async signIn(email, password) {
            const client = await ensureSupabaseLoaded();
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            if (data.user) {
                localStorage.setItem('sabi_user_id', data.user.id);
                localStorage.setItem('sabi_user_email', data.user.email);
                // Fetch profile to populate local storage
                try {
                    await this.fetchAndCacheProfile(data.user.id);
                } catch (e) {
                    console.warn('[AUTH] Could not fetch profile right away:', e);
                }
            }

            return data;
        },

        // Sign in with Google OAuth
        async signInWithGoogle() {
            const client = await ensureSupabaseLoaded();
            const redirectTo = `${window.location.origin}/auth.html`;
            const { data, error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });

            if (error) throw error;
            return data;
        },

        // Send Password Reset Email
        async resetPassword(email) {
            const client = await ensureSupabaseLoaded();
            const redirectTo = `${window.location.origin}/auth.html#reset-password`;
            const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: redirectTo
            });

            if (error) throw error;
            return data;
        },

        // Update Password (when authenticated via recovery link)
        async updatePassword(newPassword) {
            const client = await ensureSupabaseLoaded();
            const { data, error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            return data;
        },

        // Sign Out
        async signOut() {
            try {
                const client = await ensureSupabaseLoaded();
                await client.auth.signOut();
            } catch (err) {
                console.error('[AUTH] Sign out error:', err);
            } finally {
                // Clear all local auth & profile cache
                localStorage.removeItem('sabi_user_id');
                localStorage.removeItem('sabi_user_email');
                localStorage.removeItem('sabi_user_name');
                localStorage.removeItem('sabi_user_profile');
                localStorage.removeItem('sabi_academic_level');
                sessionStorage.removeItem('sabi_auth_checked');

                // Clear active session pointers and unpartitioned legacy caches
                localStorage.removeItem('sabi_active_session_id');
                localStorage.removeItem('sabi_chat_sessions_v2');
                localStorage.removeItem('sabi_chat_history_v4');
                sessionStorage.removeItem('sabi_gcal_token');
                sessionStorage.removeItem('sabi_gcal_token_expires_at');

                window.location.href = 'auth.html';
            }
        },

        // Get Current Session
        async getSession() {
            const client = await ensureSupabaseLoaded();
            const { data: { session }, error } = await client.auth.getSession();
            if (error) throw error;
            return session;
        },

        // Get Current User
        async getUser() {
            const client = await ensureSupabaseLoaded();
            const { data: { user }, error } = await client.auth.getUser();
            if (error) return null;
            return user;
        },

        // Fetch user profile from Supabase profiles table
        async fetchAndCacheProfile(userId) {
            const client = await ensureSupabaseLoaded();
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('[AUTH] Error loading profile from Supabase:', error.message);
            }

            if (data) {
                localStorage.setItem('sabi_user_profile', JSON.stringify(data));
                if (data.full_name) localStorage.setItem('sabi_user_name', data.full_name);
                if (data.level) localStorage.setItem('sabi_academic_level', data.level);
                return data;
            }

            // Fallback to local profile cache or default
            let cached = null;
            try {
                cached = JSON.parse(localStorage.getItem('sabi_user_profile') || 'null');
            } catch (e) {}

            return cached;
        },

        // Save / Update user profile
        async saveProfile(profileData) {
            const client = await ensureSupabaseLoaded();
            const user = await this.getUser();
            if (!user) throw new Error('No authenticated user found');

            const payload = {
                id: user.id,
                email: user.email,
                full_name: profileData.full_name || localStorage.getItem('sabi_user_name') || user.user_metadata?.full_name || '',
                study_mode: profileData.study_mode || 'casual', // 'university' or 'casual'
                university: profileData.university || null,
                level: profileData.level || null,
                course: profileData.course || null,
                projected_grad_year: profileData.projected_grad_year || null,
                target_gpa: profileData.target_gpa ? parseFloat(profileData.target_gpa) : null,
                onboarded: true,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await client
                .from('profiles')
                .upsert(payload)
                .select()
                .maybeSingle();

            if (error) {
                console.warn('[AUTH] Database save warning (proceeding with local session):', error.message || error);
            }

            const saved = data || payload;
            saved.onboarded = true;
            localStorage.setItem('sabi_user_profile', JSON.stringify(saved));
            localStorage.setItem('sabi_onboarded_' + user.id, 'true');
            if (saved.full_name) localStorage.setItem('sabi_user_name', saved.full_name);
            if (saved.level) localStorage.setItem('sabi_academic_level', saved.level);

            return saved;
        },

        // Check whether onboarding is needed
        async needsOnboarding() {
            const user = await this.getUser();
            if (!user) return false;

            // If local storage already verified onboarding for this specific user
            if (localStorage.getItem('sabi_onboarded_' + user.id) === 'true') {
                return false;
            }

            const profile = await this.fetchAndCacheProfile(user.id);
            if (!profile) return true;

            // If explicit onboarded flag is set
            if (profile.onboarded === true) {
                localStorage.setItem('sabi_onboarded_' + user.id, 'true');
                return false;
            }

            // If user has chosen university with details, they completed it
            if (profile.study_mode === 'university' && profile.university) {
                localStorage.setItem('sabi_onboarded_' + user.id, 'true');
                return false;
            }

            // If neither completed, they need onboarding
            return true;
        },

        // Listen for auth state changes
        async onAuthStateChange(callback) {
            const client = await ensureSupabaseLoaded();
            return client.auth.onAuthStateChange(callback);
        }
    };

    window.SabiAuth = SabiAuth;
})(window);
