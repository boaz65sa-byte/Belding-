/**
 * ========================================
 * 🔐 Auth.js - לוגיקת אימות
 * ========================================
 */

/**
 * 📝 רישום משתמש חדש
 */
async function signup(email, password, fullName, phone = null) {
    try {
        // 1. רישום ב-Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone
                }
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            return { success: false, error: getHebrewErrorMessage(authError.message) };
        }

        if (!authData.user) {
            return { success: false, error: 'לא הצלחנו ליצור משתמש' };
        }

        // 2. יצירת פרופיל מורחב בטבלה
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 14); // 14 ימי ניסיון

        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email: email,
                full_name: fullName,
                phone: phone,
                role: ROLES.USER,
                status: USER_STATUS.TRIAL,
                subscription_type: 'trial',
                trial_ends: trialEnds.toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            // ננסה למחוק את המשתמש מ-Auth אם הפרופיל נכשל
            return { success: false, error: 'שגיאה ביצירת פרופיל' };
        }

        // 3. רישום פעילות
        await logActivity('signup', `משתמש חדש נרשם: ${email}`);

        console.log('✅ משתמש נרשם בהצלחה');
        return { 
            success: true, 
            user: authData.user,
            profile: profileData,
            message: MESSAGES.he.auth.signupSuccess 
        };

    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'שגיאה ברישום. נסה שוב.' };
    }
}

/**
 * 🔐 התחברות
 */
async function login(email, password, rememberMe = false) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            return { success: false, error: getHebrewErrorMessage(error.message) };
        }

        if (!data.user) {
            return { success: false, error: 'לא הצלחנו להתחבר' };
        }

        // עדכון last_login
        await updateUserProfile(data.user.id, {
            last_login: new Date().toISOString()
        });

        // רישום פעילות
        await logActivity('login', `התחברות מוצלחת`);

        // אם "זכור אותי" - שמור ב-localStorage
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }

        console.log('✅ התחברות מוצלחת');
        return { 
            success: true, 
            user: data.user,
            session: data.session,
            message: MESSAGES.he.auth.loginSuccess 
        };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'שגיאה בהתחברות. נסה שוב.' };
    }
}

/**
 * 🚪 התנתקות
 */
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        // ניקוי localStorage
        localStorage.removeItem('rememberMe');
        
        console.log('✅ התנתקת בהצלחה');
        return { success: true, message: MESSAGES.he.auth.logoutSuccess };

    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: 'שגיאה בהתנתקות' };
    }
}

/**
 * 🔄 שינוי סיסמה
 */
async function changePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        await logActivity('password_change', 'סיסמה שונתה');
        
        return { success: true, message: 'הסיסמה שונתה בהצלחה' };
    } catch (error) {
        console.error('Password change error:', error);
        return { success: false, error: 'שגיאה בשינוי סיסמה' };
    }
}

/**
 * 📧 שליחת איפוס סיסמה
 */
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) throw error;

        return { success: true, message: 'נשלח אימייל לאיפוס סיסמה' };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: 'שגיאה בשליחת אימייל' };
    }
}

/**
 * 🔄 עדכון פרטי משתמש
 */
async function updateProfile(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'משתמש לא מחובר' };
        }

        // עדכון ב-Auth (אם יש אימייל חדש)
        if (updates.email) {
            const { error: authError } = await supabase.auth.updateUser({
                email: updates.email
            });
            if (authError) throw authError;
        }

        // עדכון ב-Profile
        const profileUpdates = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const updatedProfile = await updateUserProfile(user.id, profileUpdates);

        await logActivity('profile_update', 'פרופיל עודכן');

        return { success: true, profile: updatedProfile, message: 'הפרופיל עודכן בהצלחה' };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: 'שגיאה בעדכון פרופיל' };
    }
}

/**
 * 🌐 תרגום הודעות שגיאה לעברית
 */
function getHebrewErrorMessage(errorMessage) {
    const errorMap = {
        'Invalid login credentials': 'אימייל או סיסמה שגויים',
        'Email not confirmed': 'אנא אשר את כתובת האימייל שלך',
        'User already registered': 'משתמש זה כבר רשום במערכת',
        'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
        'Invalid email': 'כתובת אימייל לא תקינה',
        'Email rate limit exceeded': 'נשלחו יותר מדי בקשות. נסה שוב מאוחר יותר',
        'Signup requires a valid password': 'נדרשת סיסמה תקינה'
    };

    // חפש התאמה חלקית
    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
            return value;
        }
    }

    return 'שגיאה בתהליך. נסה שוב.';
}

/**
 * 🔒 בדיקת הרשאת גישה לדף
 * משמש להגנה על דפים שדורשים אימות
 */
async function requireAuth(options = {}) {
    const {
        redirect = 'login.html',
        requireAdmin = false,
        allowTrial = true
    } = options;

    try {
        const accessCheck = await checkUserAccess();

        // אין גישה - הפנה להתחברות
        if (!accessCheck.hasAccess) {
            if (accessCheck.reason === 'not_logged_in') {
                window.location.href = redirect;
                return false;
            }
            
            if (accessCheck.reason === 'blocked') {
                window.location.href = 'blocked.html';
                return false;
            }

            if (accessCheck.reason === 'trial_expired' || accessCheck.reason === 'subscription_expired' || accessCheck.reason === 'expired') {
                window.location.href = 'pricing.html?expired=true';
                return false;
            }
        }

        // בדיקת אדמין אם נדרש
        if (requireAdmin) {
            const admin = await isAdmin();
            if (!admin) {
                window.location.href = 'index.html';
                return false;
            }
        }

        // בדיקת trial אם לא מותר
        if (!allowTrial && accessCheck.status === 'trial') {
            window.location.href = 'pricing.html?trial=true';
            return false;
        }

        return true;

    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = redirect;
        return false;
    }
}

/**
 * 🎯 הצגת מידע על סטטוס המנוי
 */
async function getSubscriptionStatus() {
    try {
        const accessCheck = await checkUserAccess();
        
        if (!accessCheck.hasAccess) {
            return {
                status: 'no_access',
                message: 'אין גישה למערכת'
            };
        }

        const { status, profile, daysLeft } = accessCheck;

        if (status === 'trial') {
            return {
                status: 'trial',
                daysLeft: daysLeft,
                message: `תקופת ניסיון - נותרו ${daysLeft} ימים`,
                showUpgrade: daysLeft <= 7
            };
        }

        if (status === 'lifetime') {
            return {
                status: 'lifetime',
                message: 'מנוי לכל החיים ✨',
                showUpgrade: false
            };
        }

        if (status === 'active') {
            return {
                status: 'active',
                daysLeft: daysLeft,
                subscriptionType: accessCheck.subscriptionType,
                message: `מנוי פעיל - נותרו ${daysLeft} ימים`,
                showRenewal: daysLeft <= NOTIFICATION_CONFIG.expiry_warning_days
            };
        }

        return {
            status: 'unknown',
            message: 'סטטוס לא ידוע'
        };

    } catch (error) {
        console.error('Subscription status error:', error);
        return {
            status: 'error',
            message: 'שגיאה בבדיקת סטטוס'
        };
    }
}

console.log('✅ Auth.js נטען בהצלחה');
