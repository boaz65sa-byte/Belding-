/**
 * ========================================
 * 👑 Admin.js - ניהול אדמין
 * ========================================
 */

/**
 * 📊 קבלת כל המשתמשים (אדמין בלבד)
 */
async function getAllUsers(filters = {}) {
    try {
        // בדיקה שהמשתמש הוא אדמין
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        let query = supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

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

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, users: data };
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

        const { data, error } = await supabase
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
        const { data: user } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        // רישום תשלום (manual)
        await supabase
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
 * 💳 קבלת תשלומי משתמש
 */
async function getUserPayments(userId) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data, error } = await supabase
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
 * 📊 סטטיסטיקות אדמין
 */
async function getAdminStats() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        // ספירת משתמשים לפי סטטוס
        const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('status, subscription_type');

        if (usersError) throw usersError;

        const stats = {
            total: users.length,
            active: users.filter(u => u.status === USER_STATUS.ACTIVE).length,
            trial: users.filter(u => u.status === USER_STATUS.TRIAL).length,
            expired: users.filter(u => u.status === USER_STATUS.EXPIRED).length,
            blocked: users.filter(u => u.status === USER_STATUS.BLOCKED).length,
            monthly: users.filter(u => u.subscription_type === 'monthly').length,
            yearly: users.filter(u => u.subscription_type === 'yearly').length,
            lifetime: users.filter(u => u.subscription_type === 'lifetime').length
        };

        // סכום תשלומים
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, status')
            .eq('status', 'completed');

        if (!paymentsError && payments) {
            stats.totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        } else {
            stats.totalRevenue = 0;
        }

        return { success: true, stats };
    } catch (error) {
        console.error('שגיאה בקבלת סטטיסטיקות:', error);
        return { success: false, error: error.message };
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
        const { data: user } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .single();

        // מחק את המשתמש (CASCADE ימחק הכל)
        const { error } = await supabase
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

        const { data, error } = await supabase
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
 * 📋 ייצוא רשימת משתמשים ל-CSV
 */
async function exportUsersToCSV() {
    try {
        const admin = await isAdmin();
        if (!admin) {
            throw new Error('אין הרשאות אדמין');
        }

        const { data: users, error } = await supabase
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

console.log('✅ Admin.js נטען בהצלחה');
