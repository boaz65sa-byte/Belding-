/**
 * ========================================
 * 🔧 קובץ הגדרות - Supabase Configuration
 * ========================================
 * 
 * ⚠️ חשוב! החלף את הערכים האלה עם הנתונים מ-Supabase שלך:
 * 1. לך ל-Supabase Dashboard
 * 2. Project Settings → API
 * 3. העתק את Project URL ו-anon public key
 */

const SUPABASE_CONFIG = {
    // 🔗 URL של הפרויקט שלך
    url: 'YOUR_SUPABASE_URL_HERE', // לדוגמה: 'https://xxxxx.supabase.co'
    
    // 🔑 Anon Key (מפתח ציבורי)
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE', // eyJhbGc...
};

/**
 * 💰 הגדרות מחירים
 */
const PRICING_CONFIG = {
    trial: {
        name: 'ניסיון חינם',
        duration: 14, // ימים
        price: 0,
        features: [
            'גישה מלאה למערכת',
            'ניהול דיירים ותשלומים',
            'ניהול הוצאות',
            'דוחות ויצוא נתונים',
            'תמיכה טכנית'
        ]
    },
    monthly: {
        name: 'מנוי חודשי',
        price: 49,
        currency: 'ILS',
        symbol: '₪',
        features: [
            'כל התכונות של הניסיון',
            'גיבויים אוטומטיים',
            'תמיכה מועדפת',
            'עדכונים שוטפים',
            'ללא הגבלת דיירים'
        ]
    },
    yearly: {
        name: 'מנוי שנתי',
        price: 490,
        currency: 'ILS',
        symbol: '₪',
        savings: 98, // ₪49 * 12 - ₪490 = ₪98 חיסכון
        savingsPercent: 17, // (98 / 588) * 100
        features: [
            'כל התכונות של החודשי',
            'חודש חינם! (חיסכון של ₪98)',
            'תמיכה VIP',
            'גיבוי יומי',
            'נעילת מחיר לתמיד'
        ]
    },
    lifetime: {
        name: 'חד פעמי - לתמיד',
        price: 499,
        currency: 'ILS',
        symbol: '₪',
        features: [
            'כל התכונות לתמיד!',
            'תשלום חד פעמי',
            'ללא חידושים',
            'עדכונים לכל החיים',
            'תמיכה VIP לצמיתות'
        ],
        badge: 'הכי כדאי!'
    }
};

/**
 * 🔔 הגדרות התראות
 */
const NOTIFICATION_CONFIG = {
    email: {
        enabled: true,
        events: ['signup', 'payment', 'expiry_warning']
    },
    expiry_warning_days: 7 // התראה 7 ימים לפני תום מנוי
};

/**
 * 👑 הגדרות תפקידים
 */
const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

/**
 * 🔒 הגדרות סטטוס משתמש
 */
const USER_STATUS = {
    TRIAL: 'trial',        // תקופת ניסיון
    ACTIVE: 'active',      // מנוי פעיל
    BLOCKED: 'blocked',    // חסום על ידי אדמין
    EXPIRED: 'expired'     // מנוי פג
};

/**
 * 💳 אמצעי תשלום
 */
const PAYMENT_METHODS = {
    SIMULATION: 'simulation',     // סימולציה לבדיקות
    CREDIT_CARD: 'credit_card',   // כרטיס אשראי
    STRIPE: 'stripe',             // Stripe
    PAYPAL: 'paypal',             // PayPal
    MANUAL: 'manual'              // אישור ידני
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

/**
 * 🛡️ בדיקת תקינות הגדרות
 */
function validateConfig() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL_HERE' || 
        SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
        console.warn('⚠️ אזהרה: עדיין לא הגדרת את Supabase Config!');
        console.warn('לך לקובץ js/config.js והחלף את הערכים');
        return false;
    }
    return true;
}

// בדיקה אוטומטית בטעינת הדף
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!validateConfig()) {
            // הצג הודעה על המסך
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff9800;
                color: white;
                padding: 15px;
                text-align: center;
                z-index: 99999;
                font-weight: bold;
            `;
            warning.innerHTML = '⚠️ אזהרה: יש להגדיר את Supabase Config בקובץ js/config.js';
            document.body.insertBefore(warning, document.body.firstChild);
        }
    });
}
