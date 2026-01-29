/**
 * ========================================
 * 🔐 Auth.js - מעודכן עם איפוס סיסמה
 * ========================================
 */

function getSupabase() {
    if (window.supabaseClient) return window.supabaseClient;
    console.error('CRITICAL: Supabase client missing');
    return null;
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
        
        // יצירת פרופיל
        if (data.user) {
            await supabase.from('user_profiles').insert([{
                id: data.user.id, email, full_name: fullName, phone, role: 'user'
            }]);
        }
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 2. התחברות
async function login(email, password) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: translateError(error.message) };
    }
}

// 3. איפוס סיסמה (החדש!)
async function resetPassword(email) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        // שולח את המשתמש לדף עדכון סיסמה (צריך ליצור אותו בהמשך אם תרצה, בינתיים זה יפנה ללוגין)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html'
        });
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 4. בדיקת סשן
async function getCurrentSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// 5. יציאה
async function logout() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    window.location.href = 'login.html';
}

function translateError(msg) {
    if (msg.includes('Invalid login')) return 'פרטים שגויים';
    return msg;
}

// חשיפה לחלון
window.signup = signup;
window.login = login;
window.resetPassword = resetPassword;
window.getCurrentSession = getCurrentSession;
window.logout = logout;