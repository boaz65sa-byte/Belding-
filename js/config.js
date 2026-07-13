/**
 * ========================================
 * 🔧 קובץ הגדרות - Supabase Configuration
 * ========================================
 */

// ✅ תיקון 1: שמתי כאן את המפתחות של הפרויקט החדש (Vaad 2025)
const SUPABASE_CONFIG = {
    url: 'https://hyntopdwnibuxmpylunz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bnRvcGR3bmlidXhtcHlsdW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MzM3NDYsImV4cCI6MjA5OTUwOTc0Nn0.6yMj6tn1F56rb8SbXmCk_rJosSE1-_RkhfNM0QzDNdE',
};

// Supabase client נוצר ב-auth.js (ensureSupabaseClientSync) כשה-SDK נטען — לא נדרש בדף כניסה
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function'
    && typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey
    && !window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    });
}

/**
 * 🔐 כניסה פשוטה — משתמש וסיסמה אחדים (ללא Supabase בהתחברות)
 * שנה כאן את username ו-password לפני פריסה לציבור.
 */
const SIMPLE_AUTH = {
    enabled: false,
    username: 'vaad',
    password: 'vaad2025',
    displayName: 'מנהל הועד',
    displayEmail: 'vaad@local'
};

/**
 * 💰 הגדרות מחירים - מעודכן
 */
const PRICING_CONFIG = {
    trial: {
        name: 'ניסיון חינם',
        duration: 14,
        price: 0,
        features: ['גישה מלאה למערכת', 'ניהול דיירים ותשלומים', 'ניהול הוצאות', 'דוחות ויצוא נתונים', 'תמיכה טכנית']
    },
    monthly: {
        name: 'מנוי חודשי',
        price: 29.90,
        currency: 'ILS',
        symbol: '₪',
        features: ['כל התכונות של הניסיון', 'גיבויים אוטומטיים', 'תמיכה מועדפת', 'עדכונים שוטפים', 'ללא הגבלת דיירים']
    },
    yearly: {
        name: 'מנוי שנתי',
        price: 300,
        currency: 'ILS',
        symbol: '₪',
        savings: 58.80,
        savingsPercent: 16,
        features: ['כל התכונות של החודשי', 'חיסכון של ₪58.80 בשנה!', 'תמיכה VIP', 'גיבוי יומי', 'נעילת מחיר לתמיד']
    },
    lifetime: {
        name: 'חד פעמי - לתמיד',
        price: 500,
        currency: 'ILS',
        symbol: '₪',
        features: ['כל התכונות לתמיד!', 'תשלום חד פעמי', 'ללא חידושים', 'עדכונים לכל החיים', 'תמיכה VIP לצמיתות'],
        badge: 'הכי כדאי!'
    }
};

/**
 * 🔔 הגדרות התראות
 */
const NOTIFICATION_CONFIG = {
    email: { enabled: true, events: ['signup', 'payment', 'expiry_warning'] },
    expiry_warning_days: 7
};

/**
 * 👑 הגדרות תפקידים
 */
const ROLES = { 
    SUPER_ADMIN: 'super_admin',  // בועז - מנהל כללי של כל המערכת
    ADMIN: 'admin',              // מנהל בניין ספציפי
    USER: 'user'                 // משתמש רגיל
};

/**
 * 🔒 הגדרות סטטוס משתמש
 */
const USER_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    EXPIRED: 'expired'
};

/**
 * 💳 אמצעי תשלום
 */
const PAYMENT_METHODS = {
    SIMULATION: 'simulation',
    CREDIT_CARD: 'credit_card',
    STRIPE: 'stripe',
    PAYPAL: 'paypal',
    MANUAL: 'manual'
};

/**
 * 🎨 צבעי סטטוס
 */
const STATUS_COLORS = {
    trial: '#3498db',
    active: '#2ecc71',
    blocked: '#e74c3c',
    expired: '#95a5a6'
};

/**
 * 📱 הודעות למשתמש
 */
const MESSAGES = {
    he: {
        auth: {
            loginSuccess: 'התחברת בהצלחה! 🎉',
            loginError: 'שגיאה בהתחברות. נסה שוב.',
            signupSuccess: 'נרשמת בהצלחה! ברוך הבא! 🎊',
            signupError: 'שגיאה ברישום. נסה שוב.',
            logoutSuccess: 'התנתקת בהצלחה',
            emailNotConfirmed: 'אנא אשר את כתובת האימייל שלך',
            invalidCredentials: 'אימייל או סיסמה שגויים',
            weakPassword: 'הסיסמה חייבת להכיל לפחות 6 תווים'
        },
        trial: {
            welcome: 'ברוך הבא! יש לך {days} ימי ניסיון חינם 🎁',
            expiringSoon: 'תקופת הניסיון שלך מסתיימת בעוד {days} ימים',
            expired: 'תקופת הניסיון שלך הסתיימה. אנא שדרג מנוי.'
        },
        subscription: {
            active: 'המנוי שלך פעיל עד {date}',
            expired: 'המנוי שלך פג. אנא חדש מנוי.',
            expiringSoon: 'המנוי שלך מסתיים בעוד {days} ימים'
        },
        admin: {
            userBlocked: 'המשתמש נחסם בהצלחה',
            userUnblocked: 'המשתמש שוחרר בהצלחה',
            roleChanged: 'התפקיד שונה בהצלחה',
            deleteConfirm: 'האם אתה בטוח שברצונך למחוק משתמש זה?'
        },
        payment: {
            success: 'התשלום בוצע בהצלחה! 💳',
            failed: 'התשלום נכשל. נסה שוב.',
            processing: 'מעבד תשלום...'
        }
    }
};