/**
 * ========================================
 * 🔐 Auth.js - מתוקן למניעת פינג-פונג
 * ========================================
 */

// משתמשי מנהל על — גישה מלאה אוטומטית
const SUPER_ADMIN_EMAILS = ['boaz65sa@gmail.com', 'chef@roxoneilat.co.il'];

function isSuperAdminEmail(email) {
    return SUPER_ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase());
}

// משתנה גלובלי ללקוח Supabase
let supabaseInstance = null;

/**
 * כתובת מלאה לדף באותו תיק כמו המסך הנוכחי (חובה ל-OAuth ואיפוס סיסמה כשהאתר לא ב-root)
 */
function authResolveRedirectUrl(fileName) {
    try {
        return new URL(fileName, window.location.href).href;
    } catch (e) {
        const base = window.location.origin || '';
        const path = String(fileName || '').replace(/^\//, '');
        return base ? `${base}/${path}` : path;
    }
}

const AUTH_CLIENT_OPTIONS = {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
};

/** יצירה סינכרונית של לקוח Supabase — תואם ל-config.js (SUPABASE_CONFIG) */
function ensureSupabaseClientSync() {
    if (supabaseInstance) return supabaseInstance;
    if (window.supabaseClient) {
        supabaseInstance = window.supabaseClient;
        return supabaseInstance;
    }
    const create = typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function'
        ? window.supabase.createClient.bind(window.supabase)
        : null;
    if (!create) {
        if (!isSimpleAuthEnabled()) {
            console.warn('Supabase SDK לא נטען — לא נדרש במצב כניסה פשוטה');
        }
        return null;
    }
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabaseInstance = create(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, AUTH_CLIENT_OPTIONS);
        window.supabaseClient = supabaseInstance;
        return supabaseInstance;
    }
    if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined') {
        supabaseInstance = create(SUPABASE_URL, SUPABASE_KEY, AUTH_CLIENT_OPTIONS);
        window.supabaseClient = supabaseInstance;
        return supabaseInstance;
    }
    console.error('❌ חסר SUPABASE_CONFIG או מפתחות ב-config.js');
    return null;
}

// פונקציית אתחול - נקראת מהדף הראשי
async function initSupabase() {
    return ensureSupabaseClientSync();
}

// פונקציית עזר פנימית לקבלת הלקוח (תמיד סינכרונית — לא Promise)
function getSupabase() {
    return ensureSupabaseClientSync();
}

/** ——— כניסה פשוטה (משתמש+סיסמה מקומיים) ——— */
const SIMPLE_AUTH_STORAGE_KEY = 'vaad_simple_auth_v1';
const SIMPLE_AUTH_COOKIE_KEY = 'vaad_simple_auth_v1';

function getSimpleAuthConfig() {
    if (typeof SIMPLE_AUTH !== 'undefined' && SIMPLE_AUTH) return SIMPLE_AUTH;
    return {
        enabled: false,
        username: 'vaad',
        password: 'vaad2025',
        displayName: 'מנהל הועד',
        displayEmail: 'vaad@local'
    };
}

function isSimpleAuthEnabled() {
    const cfg = getSimpleAuthConfig();
    return !!(cfg && cfg.enabled !== false);
}

function getAuthStoragePath() {
    try {
        const p = window.location.pathname || '/';
        const i = p.lastIndexOf('/');
        return i > 0 ? p.slice(0, i + 1) : '/';
    } catch (e) {
        return '/';
    }
}

function readAuthCookie(name) {
    try {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
        return null;
    }
}

function writeAuthCookie(name, value, remember) {
    try {
        let cookie = name + '=' + encodeURIComponent(value) + '; path=' + getAuthStoragePath() + '; SameSite=Lax';
        if (remember) cookie += '; max-age=2592000';
        document.cookie = cookie;
    } catch (e) { /* ignore */ }
}

function clearAuthCookie(name) {
    try {
        document.cookie = name + '=; path=' + getAuthStoragePath() + '; max-age=0';
    } catch (e) { /* ignore */ }
}

function parseSimpleAuthSession(raw) {
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        return data && data.username ? data : null;
    } catch (e) {
        return null;
    }
}

function readSimpleAuthSession() {
    try {
        const raw = localStorage.getItem(SIMPLE_AUTH_STORAGE_KEY)
            || sessionStorage.getItem(SIMPLE_AUTH_STORAGE_KEY)
            || readAuthCookie(SIMPLE_AUTH_COOKIE_KEY);
        return parseSimpleAuthSession(raw);
    } catch (e) {
        return parseSimpleAuthSession(readAuthCookie(SIMPLE_AUTH_COOKIE_KEY));
    }
}

function writeSimpleAuthSession(username, remember) {
    const payload = JSON.stringify({
        username: username,
        loggedInAt: new Date().toISOString(),
        mode: 'simple'
    });
    try {
        sessionStorage.removeItem(SIMPLE_AUTH_STORAGE_KEY);
        localStorage.removeItem(SIMPLE_AUTH_STORAGE_KEY);
        if (remember) {
            localStorage.setItem(SIMPLE_AUTH_STORAGE_KEY, payload);
        } else {
            sessionStorage.setItem(SIMPLE_AUTH_STORAGE_KEY, payload);
        }
    } catch (e) {
        /* Safari private mode / storage blocked — cookie fallback */
    }
    writeAuthCookie(SIMPLE_AUTH_COOKIE_KEY, payload, remember);
}

function clearSimpleAuthSession() {
    try {
        sessionStorage.removeItem(SIMPLE_AUTH_STORAGE_KEY);
        localStorage.removeItem(SIMPLE_AUTH_STORAGE_KEY);
    } catch (e) { /* ignore */ }
    clearAuthCookie(SIMPLE_AUTH_COOKIE_KEY);
}

function getSimpleAuthProfile() {
    const cfg = getSimpleAuthConfig();
    return {
        id: 'simple-user',
        email: cfg.displayEmail || 'vaad@local',
        full_name: cfg.displayName || 'מנהל הועד',
        role: 'super_admin',
        status: 'active',
        has_lifetime_access: true,
        subscription_type: 'lifetime'
    };
}

function simpleAuthLogin(username, password, remember) {
    if (!isSimpleAuthEnabled()) {
        return { success: false, error: 'מצב כניסה פשוטה לא מופעל' };
    }
    const cfg = getSimpleAuthConfig();
    const u = String(username || '').trim();
    const p = String(password || '');
    if (u === cfg.username && p === cfg.password) {
        writeSimpleAuthSession(u, !!remember);
        return { success: true, user: { username: u } };
    }
    return { success: false, error: 'שם משתמש או סיסמה שגויים' };
}

/**
 * 🛑 פונקציית בדיקת גישה מורחבת
 * בודקת אם למשתמש יש גישה ומחזירה פרטי פרופיל מלאים
 */
async function checkUserAccess() {
    if (isSimpleAuthEnabled() && readSimpleAuthSession()) {
        const profile = getSimpleAuthProfile();
        return {
            hasAccess: true,
            status: 'active',
            daysLeft: null,
            profile: profile
        };
    }

    if (isSimpleAuthEnabled()) {
        return { hasAccess: false, reason: 'not_logged_in' };
    }

    const supabase = getSupabase();
    if (!supabase) return { hasAccess: false, reason: 'not_logged_in' };

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return { hasAccess: false, reason: 'not_logged_in' };
        }

        // קבל פרופיל מלא מהטבלה
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        // אם אין פרופיל בטבלה, צור אחד
        if (error || !profile) {
            console.log('📝 יוצר פרופיל חדש למשתמש...');
            
            // בדוק אם זה הסופר אדמין
            const isSuperAdmin = isSuperAdminEmail(session.user.email);
            
            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                    phone: session.user.user_metadata?.phone || '',
                    role: isSuperAdmin ? 'super_admin' : 'user',
                    status: isSuperAdmin ? 'active' : 'trial',
                    has_lifetime_access: isSuperAdmin ? true : false,
                    subscription_type: isSuperAdmin ? 'lifetime' : null,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) {
                console.error('שגיאה ביצירת פרופיל:', insertError);
                // אם נכשל, החזר גישה בסיסית
                return {
                    hasAccess: true,
                    status: 'trial',
                    daysLeft: 14,
                    profile: { ...session.user, role: 'user', status: 'trial' }
                };
            }

            return {
                hasAccess: true,
                status: newProfile.status || 'trial',
                daysLeft: 14,
                profile: newProfile
            };
        }

        // תיקון: אם זה boaz65sa@gmail.com ואין לו role של super_admin, עדכן
        if (isSuperAdminEmail(session.user.email) && profile.role !== 'super_admin') {
            console.log('🔧 מעדכן הרשאות סופר אדמין...');
            const { data: updatedProfile, error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    role: 'super_admin',
                    status: 'active',
                    has_lifetime_access: true,
                    subscription_type: 'lifetime'
                })
                .eq('id', session.user.id)
                .select()
                .single();
            
            if (!updateError && updatedProfile) {
                console.log('✅ הרשאות סופר אדמין עודכנו');
                return {
                    hasAccess: true,
                    status: 'active',
                    daysLeft: null,
                    profile: updatedProfile
                };
            }
        }

        // בדוק סטטוס מנוי
        let daysLeft = null;
        if (profile.status === 'trial') {
            const createdAt = new Date(profile.created_at);
            const trialEnd = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
            daysLeft = Math.ceil((trialEnd - new Date()) / (24 * 60 * 60 * 1000));
            
            if (daysLeft <= 0) {
                return { hasAccess: false, reason: 'trial_expired', profile };
            }
        } else if (profile.status === 'expired') {
            return { hasAccess: false, reason: 'subscription_expired', profile };
        } else if (profile.status === 'blocked') {
            return { hasAccess: false, reason: 'blocked', profile };
        } else if (profile.subscription_expires) {
            const expiresAt = new Date(profile.subscription_expires);
            daysLeft = Math.ceil((expiresAt - new Date()) / (24 * 60 * 60 * 1000));
            
            if (daysLeft <= 0 && !profile.has_lifetime_access) {
                return { hasAccess: false, reason: 'subscription_expired', profile };
            }
        }

        // עדכן last_login
        await supabase
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id);

        return {
            hasAccess: true,
            status: profile.status || 'active',
            daysLeft: daysLeft,
            profile: profile
        };
    } catch (error) {
        console.error('שגיאה בבדיקת גישה:', error);
        return { hasAccess: false, reason: 'error', error: error.message };
    }
}

// 1. הרשמה
async function signup(email, password, fullName, phone) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: fullName, phone } }
        });
        if (error) throw error;
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 1.1 הרשמה עם בניין
async function signupWithBuilding(email, password, fullName, phone, buildingAddress) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        // יצירת מזהה בניין מהכתובת
        const buildingId = buildingAddress.toLowerCase().replace(/[^a-zA-Z0-9א-ת]/g, '_');
        
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { 
                data: { 
                    full_name: fullName, 
                    phone,
                    building_name: buildingAddress,
                    building_id: buildingId
                } 
            }
        });
        if (error) throw error;
        
        // עדכן את הפרופיל עם פרטי הבניין
        if (data.user) {
            await supabase
                .from('user_profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    phone: phone,
                    building_name: buildingAddress,
                    building_id: buildingId,
                    role: 'user',
                    status: 'trial'
                });
        }
        
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 2. התחברות
async function login(usernameOrEmail, password, rememberMe) {
    if (isSimpleAuthEnabled()) {
        return simpleAuthLogin(usernameOrEmail, password, rememberMe);
    }

    const supabase = getSupabase();
    if (!supabase) {
        return { success: false, error: 'לא ניתן להתחבר כרגע. רענן את הדף או נסה שוב מאוחר יותר.' };
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: usernameOrEmail, password });
        if (error) throw error;
        return { success: true, user: data.user };
    } catch (error) {
        const msg = (error && error.message) ? String(error.message) : '';
        if (/Invalid login credentials|invalid login/i.test(msg)) {
            return { success: false, error: 'פרטים שגויים או משתמש לא קיים' };
        }
        if (/Email not confirmed|email not confirmed|not confirmed/i.test(msg)) {
            return { success: false, error: 'יש לאשר את הקישור שנשלח לאימייל לפני ההתחברות.' };
        }
        if (/network|fetch|failed/i.test(msg)) {
            return { success: false, error: 'בעיית רשת. נסה שוב או בדוק חיבור.' };
        }
        return { success: false, error: msg || 'שגיאה בהתחברות' };
    }
}

// 3. יציאה
async function logout() {
    clearSimpleAuthSession();
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// 4. בדיקת סשן (פשוטה)
async function getCurrentSession() {
    if (isSimpleAuthEnabled()) {
        const s = readSimpleAuthSession();
        if (!s) return null;
        return {
            user: { id: 'simple-user', email: getSimpleAuthConfig().displayEmail || 'vaad@local' },
            simple: true,
            username: s.username
        };
    }
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// 5. איפוס סיסמה (שליחת מייל)
async function resetPassword(email) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'שגיאת חיבור לשרת. רענן את הדף.' };
    const trimmed = String(email || '').trim();
    if (!trimmed) return { success: false, error: 'הזן כתובת אימייל.' };
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
            redirectTo: authResolveRedirectUrl('reset-password.html')
        });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        const msg = (error && error.message) ? String(error.message) : '';
        if (/fetch|network|Failed to fetch/i.test(msg)) {
            return { success: false, error: 'בעיית רשת. נסה שוב או בדוק חיבור.' };
        }
        if (/rate|too many|429/i.test(msg)) {
            return { success: false, error: 'יותר מדי בקשות. המתן דקה ונסה שוב.' };
        }
        return { success: false, error: msg || 'שגיאה בשליחת מייל האיפוס.' };
    }
}

/**
 * אחרי לחיצה על קישור מייל (איפוס / OAuth): חילוף code (PKCE), verifyOtp (token_hash), והמתנה קצרה לסשן.
 * אם ביקשת איפוס במחשב ופתחת את המייל בטלפון — PKCE עלול להיכשל (אין code verifier); הודעה מתאימה ב-return.
 */
async function finalizeAuthFromRedirectUrl(supabase, options) {
    const maxMs = (options && options.maxMs) != null ? options.maxMs : 6000;
    const intervalMs = (options && options.intervalMs) != null ? options.intervalMs : 120;
    if (!supabase) return null;

    try {
        const url = new URL(window.location.href);
        const token_hash = url.searchParams.get('token_hash');
        const otpType = url.searchParams.get('type');
        if (token_hash && otpType) {
            const { error } = await supabase.auth.verifyOtp({
                type: otpType,
                token_hash: token_hash
            });
            if (!error) {
                url.searchParams.delete('token_hash');
                url.searchParams.delete('type');
                window.history.replaceState({}, '', url.pathname + (url.search || '') + (url.hash || ''));
            }
        }

        const code = url.searchParams.get('code');
        if (code) {
            const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exErr) {
                url.searchParams.delete('code');
                window.history.replaceState({}, '', url.pathname + (url.search || '') + (url.hash || ''));
            }
        }
    } catch (e) {
        console.warn('finalizeAuthFromRedirectUrl:', e);
    }

    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return session;
        await new Promise(function (r) { setTimeout(r, intervalMs); });
    }
    return null;
}

/** התחברות OAuth (Google / Facebook) — אותה זרימת redirect ל-index.html */
async function signInWithOAuthProvider(provider) {
    const labels = { google: 'Google', facebook: 'Facebook' };
    const label = labels[provider] || provider;
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'שגיאת חיבור לשרת. רענן את הדף.' };

    try {
        const options = {
            redirectTo: authResolveRedirectUrl('index.html')
        };
        if (provider === 'google') {
            options.queryParams = {
                access_type: 'offline',
                prompt: 'consent'
            };
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options
        });

        if (error) throw error;
        if (data && data.url) {
            window.location.assign(data.url);
        }
        return { success: true, data };
    } catch (error) {
        console.error(label + ' sign-in error:', error);
        const msg = (error && error.message) ? String(error.message) : 'שגיאה לא ידועה';
        return {
            success: false,
            error: msg + ' — בדוק ב-Supabase: Authentication → Providers → ' + label + ', ו-Redirect URLs כוללים את כתובת האתר המדויקת.'
        };
    }
}

async function signInWithGoogle() {
    return signInWithOAuthProvider('google');
}

async function signInWithFacebook() {
    return signInWithOAuthProvider('facebook');
}

// 7. קבלת משתמש נוכחי
async function getCurrentUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// 8. קבלת פרופיל משתמש מהטבלה (יוצר אוטומטית אם לא קיים)
async function getUserProfile(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error || !data) {
            // נסה ליצור פרופיל חדש
            console.log('📝 פרופיל לא נמצא, יוצר חדש...');
            
            // קבל פרטי משתמש מ-auth
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const newProfile = {
                    id: userId,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    phone: user.user_metadata?.phone || '',
                    role: isSuperAdminEmail(user.email) ? 'super_admin' : 'user',
                    status: isSuperAdminEmail(user.email) ? 'active' : 'trial',
                    subscription_type: isSuperAdminEmail(user.email) ? 'lifetime' : null,
                    created_at: new Date().toISOString()
                };
                
                const { data: createdProfile, error: insertError } = await supabase
                    .from('user_profiles')
                    .upsert(newProfile)
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('שגיאה ביצירת פרופיל:', insertError);
                    return newProfile; // החזר את הפרופיל גם אם לא נשמר
                }
                
                console.log('✅ פרופיל נוצר בהצלחה');
                return createdProfile;
            }
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error getting profile:', error);
        return null;
    }
}

// 9. התנתקות
async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Sign out error:', error);
        return false;
    }
}

// חשיפה לחלון כדי ש-HTML יכיר את הפונקציות
window.initSupabase = initSupabase;
window.checkUserAccess = checkUserAccess;
window.signup = signup;
window.login = login;
window.logout = logout;
window.getCurrentSession = getCurrentSession;
window.resetPassword = resetPassword;
window.finalizeAuthFromRedirectUrl = finalizeAuthFromRedirectUrl;
window.signInWithGoogle = signInWithGoogle;
window.signInWithFacebook = signInWithFacebook;
window.getCurrentUser = getCurrentUser;
window.getUserProfile = getUserProfile;
window.signOut = signOut;
window.signupWithBuilding = signupWithBuilding;
window.authResolveRedirectUrl = authResolveRedirectUrl;