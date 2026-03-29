/**
 * ========================================
 * 🔐 Auth.js - מתוקן למניעת פינג-פונג
 * ========================================
 */

// משתנה גלובלי ללקוח Supabase
let supabaseInstance = null;

// פונקציית אתחול - נקראת מהדף הראשי
async function initSupabase() {
    if (supabaseInstance) return supabaseInstance;

    // מנסה לקחת מ-config.js
    if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined') {
        supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabaseClient = supabaseInstance;
        return supabaseInstance;
    } 
    
    // בדיקה אם כבר הוגדר חיצונית
    if (window.supabaseClient) {
        supabaseInstance = window.supabaseClient;
        return supabaseInstance;
    }

    console.error('❌ שגיאה: לא נמצאו הגדרות התחברות ל-Supabase');
    return null;
}

// פונקציית עזר פנימית לקבלת הלקוח
function getSupabase() {
    if (supabaseInstance) return supabaseInstance;
    if (window.supabaseClient) return window.supabaseClient;
    return initSupabase(); // נסה לאתחל אם לא קיים
}

/**
 * 🛑 פונקציית הבדיקה שחסרה וגרמה ללולאה
 * בודקת אם למשתמש יש גישה ומונעת את הריצוד
 */
async function checkUserAccess() {
    const supabase = await getSupabase();
    if (!supabase) return { hasAccess: false, reason: 'error' };

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return { hasAccess: false, reason: 'not_logged_in' };
    }

    // כאן אפשר להוסיף בדיקות מנוי בעתיד. כרגע נאשר גישה לכולם.
    return {
        hasAccess: true,
        status: 'active', // סטטוס מנוי פעיל
        daysLeft: 14,     // ימי ניסיון (דוגמה)
        profile: session.user
    };
}

// 1. הרשמה
async function signup(email, password, fullName, phone) {
    const supabase = await getSupabase();
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

// 2. התחברות
async function login(email, password) {
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: 'פרטים שגויים או משתמש לא קיים' };
    }
}

// 3. יציאה
async function logout() {
    const supabase = await getSupabase();
    if (supabase) await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// 4. בדיקת סשן (פשוטה)
async function getCurrentSession() {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// 5. איפוס סיסמה
async function resetPassword(email) {
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html'
        });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
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