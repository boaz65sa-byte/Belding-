/**
 * ========================================
 * 🔌 Supabase Client - חיבור למסד הנתונים
 * ========================================
 */

// הפונקציה מחזירה את ה-client הפעיל
function getSupabase() {
    return window.supabaseClient;
}

/**
 * אתחול Supabase Client
 */
async function initSupabase() {
    try {
        // אם כבר מוגדר מ-config.js, השתמש בו
        if (window.supabaseClient) {
            console.log('✅ Supabase Client נטען מ-config.js');
            return window.supabaseClient;
        }

        // בדיקה אם Supabase JS SDK נטען
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase JS SDK לא נטען. ודא שהוספת את ה-CDN ב-HTML');
        }

        // יצירת client
        window.supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        console.log('✅ Supabase Client אותחל בהצלחה');
        return window.supabaseClient;
    } catch (error) {
        console.error('❌ שגיאה באתחול Supabase:', error);
        throw error;
    }
}

/**
 * 🔐 בדיקת סשן נוכחי
 */
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await getSupabase().auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('שגיאה בקבלת סשן:', error);
        return null;
    }
}

/**
 * 👤 קבלת פרטי משתמש מחובר
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await getSupabase().auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('שגיאה בקבלת משתמש:', error);
        return null;
    }
}

/**
 * 📊 קבלת פרופיל משתמש מורחב מהטבלה
 * אם הפרופיל לא קיים - יוצר אותו אוטומטית
 */
async function getUserProfile(userId) {
    try {
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.log('📝 פרופיל לא נמצא, יוצר חדש...');
            
            // קבל פרטי משתמש מ-auth
            const { data: { user } } = await getSupabase().auth.getUser();
            
            if (user) {
                // בדוק אם זה המשתמש הראשי
                const isBossUser = user.email === 'boaz65sa@gmail.com';
                
                const newProfile = {
                    id: userId,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                    phone: user.user_metadata?.phone || '',
                    role: isBossUser ? 'super_admin' : 'user',
                    status: isBossUser ? 'active' : 'trial',
                    subscription_type: isBossUser ? 'lifetime' : null,
                    created_at: new Date().toISOString()
                };
                
                const { data: createdProfile, error: insertError } = await getSupabase()
                    .from('user_profiles')
                    .upsert(newProfile)
                    .select()
                    .single();
                
                if (insertError) {
                    console.error('שגיאה ביצירת פרופיל:', insertError);
                    return newProfile;
                }
                
                console.log('✅ פרופיל נוצר בהצלחה:', createdProfile);
                return createdProfile;
            }
            return null;
        }
        
        // אם זה המשתמש הראשי ואין לו הרשאות - עדכן
        if (data.email === 'boaz65sa@gmail.com' && data.role !== 'super_admin') {
            console.log('🔧 מעדכן הרשאות למשתמש ראשי...');
            const { data: updatedProfile } = await getSupabase()
                .from('user_profiles')
                .update({ 
                    role: 'super_admin', 
                    status: 'active',
                    subscription_type: 'lifetime'
                })
                .eq('id', userId)
                .select()
                .single();
            
            return updatedProfile || data;
        }
        
        return data;
    } catch (error) {
        console.error('שגיאה בקבלת פרופיל:', error);
        return null;
    }
}

/**
 * 🔄 עדכון פרופיל משתמש
 */
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('שגיאה בעדכון פרופיל:', error);
        throw error;
    }
}

/**
 * 🔒 בדיקת סטטוס וגישה
 */
async function checkUserAccess() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { hasAccess: false, reason: 'not_logged_in' };
        }

        const profile = await getUserProfile(user.id);
        if (!profile) {
            return { hasAccess: false, reason: 'no_profile' };
        }

        // בדיקת חסימה
        if (profile.status === USER_STATUS.BLOCKED) {
            return { hasAccess: false, reason: 'blocked', profile };
        }

        // בדיקת תוקף מנוי
        const now = new Date();
        
        // אם בתקופת ניסיון
        if (profile.status === USER_STATUS.TRIAL) {
            const trialEnds = new Date(profile.trial_ends);
            if (now > trialEnds) {
                // תקופת ניסיון פגה
                await updateUserProfile(user.id, { status: USER_STATUS.EXPIRED });
                return { hasAccess: false, reason: 'trial_expired', profile };
            }
            return { hasAccess: true, status: 'trial', profile, daysLeft: Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24)) };
        }

        // אם מנוי רגיל
        if (profile.subscription_type === 'lifetime') {
            return { hasAccess: true, status: 'lifetime', profile };
        }

        // בדיקת תוקף מנוי (חודשי/שנתי)
        if (profile.subscription_expires) {
            const expiresAt = new Date(profile.subscription_expires);
            if (now > expiresAt) {
                await updateUserProfile(user.id, { status: USER_STATUS.EXPIRED });
                return { hasAccess: false, reason: 'subscription_expired', profile };
            }

            const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            return { 
                hasAccess: true, 
                status: 'active', 
                profile, 
                daysLeft,
                subscriptionType: profile.subscription_type
            };
        }

        // אם אין מנוי כלל
        if (profile.status === USER_STATUS.EXPIRED) {
            return { hasAccess: false, reason: 'expired', profile };
        }

        return { hasAccess: true, status: 'active', profile };
    } catch (error) {
        console.error('שגיאה בבדיקת גישה:', error);
        return { hasAccess: false, reason: 'error', error };
    }
}

/**
 * 👑 בדיקה אם המשתמש הוא אדמין (כולל super_admin)
 */
async function isAdmin() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const profile = await getUserProfile(user.id);
        return profile && (profile.role === ROLES.ADMIN || profile.role === ROLES.SUPER_ADMIN);
    } catch (error) {
        console.error('שגיאה בבדיקת אדמין:', error);
        return false;
    }
}

/**
 * 🔥 בדיקה אם המשתמש הוא סופר-אדמין (מנהל כללי)
 */
async function isSuperAdmin() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const profile = await getUserProfile(user.id);
        return profile && profile.role === ROLES.SUPER_ADMIN;
    } catch (error) {
        console.error('שגיאה בבדיקת סופר-אדמין:', error);
        return false;
    }
}

/**
 * 📝 רישום פעילות ב-Log
 */
async function logActivity(actionType, description, metadata = {}) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const { error } = await getSupabase()
            .from('activity_log')
            .insert({
                user_id: user.id,
                action_type: actionType,
                description: description,
                metadata: metadata
            });

        if (error) throw error;
    } catch (error) {
        console.error('שגיאה ברישום פעילות:', error);
    }
}

/**
 * 🔔 האזנה לשינויים באימות
 */
function onAuthStateChange(callback) {
    if (!getSupabase()) {
        console.error('Supabase לא אותחל');
        return;
    }

    return getSupabase().auth.onAuthStateChange((event, session) => {
        console.log('🔐 אירוע אימות:', event);
        callback(event, session);
    });
}

/**
 * 🚪 התנתקות
 */
async function signOut() {
    try {
        const { error } = await getSupabase().auth.signOut();
        if (error) throw error;
        
        // ניקוי localStorage
        localStorage.clear();
        
        console.log('✅ התנתקת בהצלחה');
        return true;
    } catch (error) {
        console.error('❌ שגיאה בהתנתקות:', error);
        return false;
    }
}

// אתחול אוטומטי בטעינת הדף
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await initSupabase();
        } catch (error) {
            console.error('שגיאה באתחול:', error);
        }
    });
}
