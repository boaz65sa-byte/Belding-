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
 * 🛑 פונקציית בדיקת גישה מורחבת
 * בודקת אם למשתמש יש גישה ומחזירה פרטי פרופיל מלאים
 */
async function checkUserAccess() {
    const supabase = await getSupabase();
    if (!supabase) return { hasAccess: false, reason: 'error' };

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
            const isSuperAdmin = session.user.email === 'boaz65sa@gmail.com';
            
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
        if (session.user.email === 'boaz65sa@gmail.com' && profile.role !== 'super_admin') {
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

// 1.1 הרשמה עם בניין
async function signupWithBuilding(email, password, fullName, phone, buildingAddress) {
    const supabase = await getSupabase();
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

// 6. התחברות עם Google
async function signInWithGoogle() {
    const supabase = await getSupabase();
    if (!supabase) return { success: false, error: 'Connection Error' };
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: error.message };
    }
}

// 7. קבלת משתמש נוכחי
async function getCurrentUser() {
    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
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
                    role: user.email === 'boaz65sa@gmail.com' ? 'super_admin' : 'user',
                    status: user.email === 'boaz65sa@gmail.com' ? 'active' : 'trial',
                    subscription_type: user.email === 'boaz65sa@gmail.com' ? 'lifetime' : null,
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
    const supabase = await getSupabase();
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
window.signInWithGoogle = signInWithGoogle;
window.getCurrentUser = getCurrentUser;
window.getUserProfile = getUserProfile;
window.signOut = signOut;
window.signupWithBuilding = signupWithBuilding;