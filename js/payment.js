/**
 * ========================================
 * 💳 Payment.js - לוגיקת תשלומים
 * ========================================
 */

/**
 * 💳 עיבוד תשלום (סימולציה או אמיתי)
 */
async function processPayment(planType, paymentMethod = 'simulation') {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('משתמש לא מחובר');
        }

        const planConfig = PRICING_CONFIG[planType];
        if (!planConfig) {
            throw new Error('תוכנית לא קיימת');
        }

        // רישום תשלום
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                amount: planConfig.price,
                currency: planConfig.currency || 'ILS',
                payment_method: paymentMethod,
                status: 'completed', // בסימולציה - תמיד מצליח
                subscription_type: planType,
                transaction_id: `SIM-${Date.now()}`,
                notes: paymentMethod === 'simulation' ? 'תשלום סימולציה' : 'תשלום אמיתי'
            })
            .select()
            .single();

        if (paymentError) throw paymentError;

        // עדכון מנוי המשתמש
        const subscriptionData = {
            type: planType,
            amount: planConfig.price
        };

        const { data: updatedUser, error: updateError } = await updateUserSubscription(user.id, subscriptionData);
        
        if (updateError) throw updateError;

        // רישום פעילות
        await logActivity('payment_completed', `תשלום הושלם: ${planConfig.name} - ₪${planConfig.price}`);

        return { 
            success: true, 
            payment,
            user: updatedUser,
            message: 'התשלום בוצע בהצלחה!' 
        };

    } catch (error) {
        console.error('שגיאה בתשלום:', error);
        
        // רישום תשלום כושל
        try {
            const user = await getCurrentUser();
            if (user) {
                await supabase.from('payments').insert({
                    user_id: user.id,
                    amount: PRICING_CONFIG[planType]?.price || 0,
                    status: 'failed',
                    subscription_type: planType,
                    notes: `שגיאה: ${error.message}`
                });
            }
        } catch (e) {
            console.error('שגיאה ברישום תשלום כושל:', e);
        }

        return { success: false, error: error.message };
    }
}

/**
 * 🔄 חידוש מנוי קיים
 */
async function renewSubscription() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('משתמש לא מחובר');
        }

        const profile = await getUserProfile(user.id);
        if (!profile) {
            throw new Error('פרופיל לא נמצא');
        }

        // חידוש לפי סוג המנוי הנוכחי
        const currentPlan = profile.subscription_type;
        if (currentPlan === 'trial') {
            throw new Error('לא ניתן לחדש מנוי ניסיון');
        }

        if (currentPlan === 'lifetime') {
            throw new Error('מנוי לכל החיים לא דורש חידוש');
        }

        const result = await processPayment(currentPlan, 'simulation');
        return result;

    } catch (error) {
        console.error('שגיאה בחידוש מנוי:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 💎 שדרוג מנוי
 */
async function upgradeSubscription(newPlanType) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('משתמש לא מחובר');
        }

        const profile = await getUserProfile(user.id);
        if (!profile) {
            throw new Error('פרופיל לא נמצא');
        }

        // בדוק שזה שדרוג אמיתי
        const planOrder = { trial: 0, monthly: 1, yearly: 2, lifetime: 3 };
        const currentOrder = planOrder[profile.subscription_type] || 0;
        const newOrder = planOrder[newPlanType] || 0;

        if (newOrder <= currentOrder) {
            throw new Error('ניתן רק לשדרג מנוי, לא להוריד');
        }

        // עבד את התשלום
        const result = await processPayment(newPlanType, 'simulation');
        return result;

    } catch (error) {
        console.error('שגיאה בשדרוג מנוי:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📊 היסטוריית תשלומים של המשתמש
 */
async function getMyPayments() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('משתמש לא מחובר');
        }

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, payments: data };
    } catch (error) {
        console.error('שגיאה בקבלת תשלומים:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 🔗 יצירת קישור תשלום Stripe (עתידי)
 */
async function createStripeCheckout(planType) {
    try {
        // TODO: אינטגרציה עם Stripe
        // const response = await fetch('/api/create-checkout-session', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ planType })
        // });
        // const { url } = await response.json();
        // window.location.href = url;

        console.warn('Stripe לא מוגדר - משתמש בסימולציה');
        return await processPayment(planType, 'simulation');

    } catch (error) {
        console.error('שגיאה ביצירת תשלום Stripe:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 💰 חישוב מחיר עם הנחה
 */
function calculatePrice(planType, promoCode = null) {
    const planConfig = PRICING_CONFIG[planType];
    if (!planConfig) {
        return { error: 'תוכנית לא קיימת' };
    }

    let finalPrice = planConfig.price;
    let discount = 0;
    let discountPercent = 0;

    // קודי קופון (דוגמה)
    const promoCodes = {
        'FIRST10': { percent: 10, description: '10% הנחה למצטרפים חדשים' },
        'YEARLY20': { percent: 20, description: '20% הנחה למנוי שנתי', validFor: ['yearly'] },
        'VIP50': { percent: 50, description: '50% הנחה VIP' }
    };

    if (promoCode && promoCodes[promoCode.toUpperCase()]) {
        const promo = promoCodes[promoCode.toUpperCase()];
        
        // בדוק תוקף
        if (promo.validFor && !promo.validFor.includes(planType)) {
            return {
                error: `קוד הקופון תקף רק עבור: ${promo.validFor.join(', ')}`
            };
        }

        discountPercent = promo.percent;
        discount = (finalPrice * discountPercent) / 100;
        finalPrice = finalPrice - discount;
    }

    return {
        success: true,
        originalPrice: planConfig.price,
        discount: discount,
        discountPercent: discountPercent,
        finalPrice: finalPrice,
        currency: planConfig.currency || 'ILS',
        symbol: planConfig.symbol || '₪'
    };
}

/**
 * 📧 שליחת קבלה באימייל (עתידי)
 */
async function sendReceiptEmail(paymentId) {
    try {
        // TODO: אינטגרציה עם Email Service
        await logActivity('receipt_email', `נשלחה קבלה לתשלום ${paymentId}`);
        
        return { 
            success: true, 
            message: 'קבלה נשלחה באימייל (אינטגרציה בפיתוח)' 
        };
    } catch (error) {
        console.error('שגיאה בשליחת קבלה:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📄 ייצוא קבלה ל-PDF (דמה)
 */
function downloadReceipt(payment) {
    const receiptHTML = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 40px; }
                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { color: #667eea; }
                .details { background: #f7fafc; padding: 20px; border-radius: 8px; }
                .row { display: flex; justify-content: space-between; margin: 10px 0; }
                .footer { margin-top: 40px; text-align: center; color: #718096; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ועד 2025</h1>
                <h2>קבלה על תשלום</h2>
            </div>
            <div class="details">
                <div class="row">
                    <strong>מספר תשלום:</strong>
                    <span>${payment.id}</span>
                </div>
                <div class="row">
                    <strong>תאריך:</strong>
                    <span>${new Date(payment.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div class="row">
                    <strong>סכום:</strong>
                    <span>₪${payment.amount}</span>
                </div>
                <div class="row">
                    <strong>אמצעי תשלום:</strong>
                    <span>${payment.payment_method}</span>
                </div>
                <div class="row">
                    <strong>סוג מנוי:</strong>
                    <span>${payment.subscription_type}</span>
                </div>
                <div class="row">
                    <strong>סטטוס:</strong>
                    <span>${payment.status === 'completed' ? 'שולם' : 'ממתין'}</span>
                </div>
            </div>
            <div class="footer">
                <p>תודה שבחרת במערכת ועד 2025!</p>
                <p>© 2024-2026 בועז סעדה</p>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${payment.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

console.log('✅ Payment.js נטען בהצלחה');
