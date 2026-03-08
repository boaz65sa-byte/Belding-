/**
 * ========================================
 * 👑 Admin.js - ניהול אדמין
 * ========================================
 * תומך ב-3 רמות הרשאות:
 * - super_admin: רואה את כל המשתמשים בכל הבניינים
 * - admin: רואה רק משתמשים מהבניין שלו
 * - user: אין גישה לפאנל אדמין
 */

/**
 * 📊 קבלת כל המשתמשים (לפי הרשאות)
 */
async function getAllUsers(filters = {}) {
    try {
        // בדיקה שהמשתמש הוא אדמין
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // בדוק אם סופר-אדמין
        const superAdmin = await isSuperAdmin();
        const currentUser = await getCurrentUser();
        const currentProfile = await getUserProfile(currentUser.id);

        let query = getSupabase()
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // אם לא סופר-אדמין, הצג רק משתמשים מאותו בניין
        if (!superAdmin && currentProfile.building_id) {
            query = query.eq('building_id', currentProfile.building_id);
        }

        // פילטרים
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.role) {
            query = query.eq('role', filters.role);
        }
        if (filters.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
        if (filters.building_id) {
            query = query.eq('building_id', filters.building_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, users: data, isSuperAdmin: superAdmin };
    } catch (error) {
        console.error('שגיאה בקבלת משתמשים:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔒 חסימת משתמש
 */
async function blockUser(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({ status: USER_STATUS.BLOCKED })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_block_user', `אדמין חסם משתמש: ${data.email}`);

        return { success: true, user: data, message: 'המשתמש נחסם בהצלחה' };
    } catch (error) {
        console.error('שגיאה בחסימת משתמש:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔓 שחרור משתמש
 */
async function unblockUser(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // קבע סטטוס לפי מנוי
        const { data: user } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        let newStatus = USER_STATUS.ACTIVE;
        
        // בדוק אם עדיין בתקופת ניסיון
        if (user.subscription_type === 'trial') {
            const trialEnds = new Date(user.trial_ends);
            if (new Date() < trialEnds) {
                newStatus = USER_STATUS.TRIAL;
            } else {
                newStatus = USER_STATUS.EXPIRED;
            }
        } else if (user.subscription_expires) {
            const expiresAt = new Date(user.subscription_expires);
            newStatus = new Date() < expiresAt ? USER_STATUS.ACTIVE : USER_STATUS.EXPIRED;
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({ status: newStatus })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_unblock_user', `אדמין שחרר משתמש: ${data.email}`);

        return { success: true, user: data, message: 'המשתמש שוחרר בהצלחה' };
    } catch (error) {
        console.error('שגיאה בשחרור משתמש:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 👑 שינוי תפקיד משתמש
 */
async function changeUserRole(userId, newRole) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        if (newRole !== ROLES.ADMIN && newRole !== ROLES.USER) {
            throw new Error('תפקיד לא תקין');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({ role: newRole })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_change_role', `אדמין שינה תפקיד למשתמש ${data.email}: ${newRole}`);

        return { success: true, user: data, message: 'התפקיד שונה בהצלחה' };
    } catch (error) {
        console.error('שגיאה בשינוי תפקיד:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔄 עדכון מנוי משתמש (אדמין)
 */
async function updateUserSubscription(userId, subscriptionData) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const updates = {
            subscription_type: subscriptionData.type,
            status: USER_STATUS.ACTIVE,
            updated_at: new Date().toISOString()
        };

        // חישוב תאריך תפוגה
        if (subscriptionData.type === 'lifetime') {
            updates.subscription_expires = null; // אין תפוגה
        } else if (subscriptionData.type === 'monthly') {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            updates.subscription_expires = expiresAt.toISOString();
        } else if (subscriptionData.type === 'yearly') {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            updates.subscription_expires = expiresAt.toISOString();
        }

        if (!updates.subscription_start) {
            updates.subscription_start = new Date().toISOString();
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // רישום תשלום (manual)
        await getSupabase()
            .from('payments')
            .insert({
                user_id: userId,
                amount: subscriptionData.amount || 0,
                currency: 'ILS',
                payment_method: 'manual',
                status: 'completed',
                subscription_type: subscriptionData.type,
                notes: `עדכון ידני ע"י אדמין`
            });

        await logActivity('admin_update_subscription', `אדמין עדכן מנוי למשתמש ${data.email}: ${subscriptionData.type}`);

        return { success: true, user: data, message: 'המנוי עודכן בהצלחה' };
    } catch (error) {
        console.error('שגיאה בעדכון מנוי:', error);
        return { success: false, error: error.message };
    }
}

/**
 * ⏸️ הפסקת מנוי משתמש
 */
async function cancelSubscription(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({
                status: USER_STATUS.EXPIRED,
                subscription_expires: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_cancel_subscription', `אדמין ביטל מנוי למשתמש: ${data.email}`);

        return { success: true, user: data, message: 'המנוי בוטל בהצלחה' };
    } catch (error) {
        console.error('שגיאה בביטול מנוי:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔄 חידוש מנוי משתמש (הארכה)
 */
async function renewSubscription(userId, months = 1) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // קבל פרטי משתמש נוכחיים
        const { data: user, error: userError } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // חשב תאריך תפוגה חדש
        let newExpiry = new Date();
        if (user.subscription_expires && new Date(user.subscription_expires) > new Date()) {
            // אם יש תאריך תפוגה עתידי, הוסף עליו
            newExpiry = new Date(user.subscription_expires);
        }
        newExpiry.setMonth(newExpiry.getMonth() + months);

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({
                status: USER_STATUS.ACTIVE,
                subscription_expires: newExpiry.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_renew_subscription', `אדמין חידש מנוי למשתמש ${data.email} ב-${months} חודשים`);

        return { success: true, user: data, message: `המנוי חודש ב-${months} חודשים` };
    } catch (error) {
        console.error('שגיאה בחידוש מנוי:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🏢 הקצאת משתמש לבניין
 */
async function assignUserToBuilding(userId, buildingId, buildingName) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({
                building_id: buildingId,
                building_name: buildingName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_assign_building', `אדמין הקצה משתמש ${data.email} לבניין: ${buildingName}`);

        return { success: true, user: data, message: 'המשתמש הוקצה לבניין בהצלחה' };
    } catch (error) {
        console.error('שגיאה בהקצאת בניין:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 👑 הפיכת משתמש לאדמין של בניין
 */
async function makeUserBuildingAdmin(userId, buildingId, buildingName) {
    try {
        const superAdmin = await isSuperAdmin();
        if (!superAdmin) {
            throw new Error('רק סופר-אדמין יכול למנות אדמינים');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .update({
                role: ROLES.ADMIN,
                building_id: buildingId,
                building_name: buildingName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await logActivity('admin_make_building_admin', `סופר-אדמין מינה את ${data.email} כאדמין של בניין: ${buildingName}`);

        return { success: true, user: data, message: 'המשתמש מונה כאדמין בניין בהצלחה' };
    } catch (error) {
        console.error('שגיאה במינוי אדמין בניין:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 💳 קבלת תשלומי משתמש
 */
async function getUserPayments(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await getSupabase()
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, payments: data };
    } catch (error) {
        console.error('שגיאה בקבלת תשלומים:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📊 סטטיסטיקות אדמין - מורחבות
 */
async function getAdminStats() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // בדוק אם סופר-אדמין
        const superAdmin = await isSuperAdmin();
        const currentUser = await getCurrentUser();
        const currentProfile = currentUser ? await getUserProfile(currentUser.id) : null;

        // ספירת משתמשים לפי סטטוס
        let query = getSupabase()
            .from('user_profiles')
            .select('status, subscription_type, building_id, building_name, created_at, last_login');

        // אם לא סופר-אדמין, הצג רק משתמשים מאותו בניין
        if (!superAdmin && currentProfile?.building_id) {
            query = query.eq('building_id', currentProfile.building_id);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) throw usersError;

        // חישוב בניינים ייחודיים
        const uniqueBuildings = [...new Set(users.filter(u => u.building_id).map(u => u.building_id))];

        const stats = {
            total: users.length,
            active: users.filter(u => u.status === USER_STATUS.ACTIVE).length,
            trial: users.filter(u => u.status === USER_STATUS.TRIAL).length,
            expired: users.filter(u => u.status === USER_STATUS.EXPIRED).length,
            blocked: users.filter(u => u.status === USER_STATUS.BLOCKED).length,
            monthly: users.filter(u => u.subscription_type === 'monthly').length,
            yearly: users.filter(u => u.subscription_type === 'yearly').length,
            lifetime: users.filter(u => u.subscription_type === 'lifetime').length,
            buildings: uniqueBuildings.length,
            todayLogins: 0
        };

        // ספירת התחברויות היום
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        stats.todayLogins = users.filter(u => {
            if (!u.last_login) return false;
            const loginDate = new Date(u.last_login);
            return loginDate >= today;
        }).length;

        // סכום תשלומים כולל
        const { data: payments, error: paymentsError } = await getSupabase()
            .from('payments')
            .select('amount, status, created_at')
            .eq('status', 'completed');

        if (!paymentsError && payments) {
            stats.totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            // הכנסות החודש הנוכחי
            const firstOfMonth = new Date();
            firstOfMonth.setDate(1);
            firstOfMonth.setHours(0, 0, 0, 0);
            
            stats.monthlyRevenue = payments
                .filter(p => new Date(p.created_at) >= firstOfMonth)
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        } else {
            stats.totalRevenue = 0;
            stats.monthlyRevenue = 0;
        }

        return { success: true, stats };
    } catch (error) {
        console.error('שגיאה בקבלת סטטיסטיקות:', error);
        return { success: false, error: error.message, stats: {} };
    }
}

/**
 * 🗑️ מחיקת משתמש (זהירות!)
 */
async function deleteUser(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // קודם קבל את פרטי המשתמש
        const { data: user } = await getSupabase()
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .single();

        // מחק את המשתמש (CASCADE ימחק הכל)
        const { error } = await getSupabase()
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        await logActivity('admin_delete_user', `אדמין מחק משתמש: ${user?.email || userId}`);

        return { success: true, message: 'המשתמש נמחק בהצלחה' };
    } catch (error) {
        console.error('שגיאה במחיקת משתמש:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔍 חיפוש משתמשים
 */
async function searchUsers(searchTerm) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return { success: true, users: data };
    } catch (error) {
        console.error('שגיאה בחיפוש משתמשים:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📧 שליחת הודעה למשתמש (עתידי - דורש Email Service)
 */
async function sendMessageToUser(userId, message) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // כרגע רק רושם ב-log
        await logActivity('admin_send_message', `אדמין שלח הודעה למשתמש ${userId}: ${message.substring(0, 50)}...`);

        // TODO: אינטגרציה עם Email Service (SendGrid, Mailgun, וכו')

        return { success: true, message: 'ההודעה נרשמה (אינטגרציית אימייל בפיתוח)' };
    } catch (error) {
        console.error('שגיאה בשליחת הודעה:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📱 שליחת תזכורת תשלום בוואטסאפ
 */
async function sendPaymentReminderWhatsApp(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // קבל פרטי משתמש
        const { data: user, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (!user.phone) {
            return { success: false, error: 'למשתמש אין מספר טלפון' };
        }

        // נקה את מספר הטלפון (הסר מקפים, רווחים וכו')
        let phone = user.phone.replace(/[\s\-\(\)]/g, '');
        
        // אם מתחיל ב-0, החלף ל-972
        if (phone.startsWith('0')) {
            phone = '972' + phone.substring(1);
        }
        
        // אם לא מתחיל ב-+, הוסף
        if (!phone.startsWith('+')) {
            phone = '+' + phone;
        }

        // הכן את ההודעה
        const userName = user.full_name || 'לקוח יקר';
        const subscriptionType = user.subscription_type || 'trial';
        const status = user.status;
        
        let message = '';
        
        if (status === 'expired' || status === 'blocked') {
            message = `שלום ${userName}! 👋

המנוי שלך למערכת ניהול הדיירים פג תוקף.

💳 לחידוש המנוי והמשך השימוש במערכת:
https://belding.vercel.app/pricing.html

📞 לשאלות ותמיכה אנחנו כאן!

בברכה,
צוות ניהול הדיירים`;
        } else if (status === 'trial') {
            const trialEnds = user.trial_ends ? new Date(user.trial_ends) : null;
            const daysLeft = trialEnds ? Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24)) : 0;
            
            message = `שלום ${userName}! 👋

תקופת הניסיון שלך ${daysLeft > 0 ? `מסתיימת בעוד ${daysLeft} ימים` : 'הסתיימה'}.

🎁 שדרג עכשיו ותיהנה מכל התכונות:
https://belding.vercel.app/pricing.html

✅ מנוי חודשי: ₪49
✅ מנוי שנתי: ₪490 (חיסכון של 17%!)
✅ לכל החיים: ₪499 בלבד!

בברכה,
צוות ניהול הדיירים`;
        } else {
            message = `שלום ${userName}! 👋

תודה שאתה משתמש במערכת ניהול הדיירים שלנו!

📊 סטטוס המנוי שלך: ${getSubscriptionTypeText(subscriptionType)}

לכל שאלה אנחנו כאן!

בברכה,
צוות ניהול הדיירים`;
        }

        // קידוד ההודעה ל-URL
        const encodedMessage = encodeURIComponent(message);
        
        // יצירת קישור וואטסאפ
        const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`;
        
        // רישום פעילות
        await logActivity('admin_whatsapp_reminder', `נשלחה תזכורת תשלום ב-WhatsApp ל: ${user.email}`);

        return { 
            success: true, 
            url: whatsappUrl,
            message: 'קישור וואטסאפ נוצר בהצלחה'
        };
    } catch (error) {
        console.error('שגיאה בשליחת תזכורת וואטסאפ:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📱 שליחת תזכורת תשלום לכל המשתמשים שפג להם המנוי
 */
async function sendBulkPaymentReminders() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // קבל משתמשים עם מנוי שפג או בניסיון
        const { data: users, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .in('status', ['expired', 'trial'])
            .not('phone', 'is', null);

        if (error) throw error;

        const results = [];
        for (const user of users) {
            const result = await sendPaymentReminderWhatsApp(user.id);
            results.push({ user: user.email, ...result });
        }

        return { 
            success: true, 
            count: results.length,
            results 
        };
    } catch (error) {
        console.error('שגיאה בשליחת תזכורות:', error);
        return { success: false, error: error.message };
    }
}

// פונקציית עזר לטקסט סוג מנוי
function getSubscriptionTypeText(type) {
    const texts = {
        monthly: 'חודשי',
        yearly: 'שנתי',
        lifetime: 'לכל החיים',
        trial: 'ניסיון'
    };
    return texts[type] || type;
}

/**
 * 📋 ייצוא רשימת משתמשים ל-CSV
 */
async function exportUsersToCSV() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data: users, error } = await getSupabase()
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // יצירת CSV
        const headers = ['שם מלא', 'אימייל', 'טלפון', 'תפקיד', 'סטטוס', 'סוג מנוי', 'תאריך הצטרפות'];
        const rows = users.map(u => [
            u.full_name || '',
            u.email || '',
            u.phone || '',
            u.role === 'admin' ? 'אדמין' : 'משתמש',
            u.status === 'active' ? 'פעיל' : u.status === 'trial' ? 'ניסיון' : u.status === 'expired' ? 'פג' : 'חסום',
            u.subscription_type === 'monthly' ? 'חודשי' : u.subscription_type === 'yearly' ? 'שנתי' : u.subscription_type === 'lifetime' ? 'לכל החיים' : 'ניסיון',
            new Date(u.created_at).toLocaleDateString('he-IL')
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        // הורדה
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        await logActivity('admin_export_users', `אדמין ייצא רשימת משתמשים (${users.length} משתמשים)`);

        return { success: true, message: `${users.length} משתמשים יוצאו בהצלחה` };
    } catch (error) {
        console.error('שגיאה בייצוא משתמשים:', error);
        return { success: false, error: error.message };
    }
}

// חשיפה לחלון
window.cancelSubscription = cancelSubscription;
window.renewSubscription = renewSubscription;
window.assignUserToBuilding = assignUserToBuilding;
window.makeUserBuildingAdmin = makeUserBuildingAdmin;

console.log('✅ Admin.js נטען בהצלחה');
