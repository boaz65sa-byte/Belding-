/**
 * ========================================
 * 🔐 Auth.js - לוגיקה פשוטה ועובדת
 * ========================================
 */

// ✅ פונקציית עזר: קבלת הלקוח בצורה בטוחה
function getSupabase() {
    if (window.supabaseClient) return window.supabaseClient;
    console.error('CRITICAL: Supabase client missing');
    alert('שגיאת חיבור: נסה לרענן את הדף (Ctrl+Shift+R)');
    return null;
}

// ✅ 1. הרשמה (Sign Up)
async function signup(email, password, fullName, phone) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        console.log('Starting signup for:', email);

        // שלב א: יצירת משתמש
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: fullName, phone: phone } // שומר במטא-דאטה של המשתמש
            }
        });

        if (authError) throw authError;

        // שלב ב: יצירת פרופיל בטבלה (אופציונלי - אם נכשל לא נורא)
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    phone: phone,
                    role: 'admin', // נותן אדמין למשתמש הראשון באופן זמני
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) console.warn('Profile creation warning:', profileError);
        }

        return { success: true, user: authData.user };

    } catch (error) {
        console.error('Signup Error:', error);
        return { success: false, error: translateError(error.message) };
    }
}

// ✅ 2. התחברות (Login)
async function login(email, password, rememberMe = false) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };

    try {
        console.log('Logging in:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // שמירת "זכור אותי" אם צריך
        if (rememberMe) localStorage.setItem('rememberMe', 'true');

        return { success: true, user: data.user };

    } catch (error) {
        console.error('Login Error:', error);
        return { success: false, error: translateError(error.message) };
    }
}

// ✅ 3. בדיקת משתמש מחובר (Session)
async function getCurrentSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ✅ 4. יציאה (Logout)
async function logout() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// 🌐 תרגום שגיאות לעברית
function translateError(msg) {
    if (msg.includes('Invalid login')) return 'אימייל או סיסמה שגויים';
    if (msg.includes('Email not confirmed')) return 'יש לאשר את המייל תחילה';
    if (msg.includes('User already registered')) return 'המייל הזה כבר רשום במערכת';
    return 'שגיאה כללית: ' + msg;
}

// חשיפת הפונקציות לחלון (כדי שה-HTML יכיר אותן)
window.signup = signup;
window.login = login;
window.getCurrentSession = getCurrentSession;
window.logout = logout;

console.log('✅ Auth.js Loaded Successfully');