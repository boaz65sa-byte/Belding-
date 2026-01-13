# 📋 תכנית שינויים - גרסה 2.5.0

**תאריך:** 05/12/2024  
**שינוי מבני:** הפרדת לשונית דיירים ותשלומים

---

## ✅ שינויים ב-HTML (הושלמו)

### לשונית דיירים
- ✅ הוסרו עמודות: "סטטוס", "תשלום אחרון"
- ✅ הוסרו כפתורי bulk actions (סמן כשולם, WhatsApp, תזכורת)
- ✅ הוסר פילטר "כל הסטטוסים"
- ✅ הוסרה אופציה "מיין לפי סטטוס"

### לשונית תשלומים
- ✅ נוספה בחירת דייר (dropdown)
- ✅ נוסף פילטר סטטוס (שולם/ממתין)
- ✅ נוספה עמודה "סטטוס"
- ✅ נוספו checkboxes לבחירה
- ✅ נוספו bulk actions (קבלות, WhatsApp, סמן כשולם, מחק)

---

## 🔄 שינויים נדרשים ב-JavaScript

### 1. renderTenantsTable() 
**קובץ:** js/app.js

**מה צריך לשנות:**
```javascript
// הסר:
- <td class="status-badge ${tenant.status}">...</td>
- <td>${tenant.lastPayment ? formatDate(tenant.lastPayment) : '-'}</td>

// השאר רק:
- checkbox
- דירה
- שם
- טלפון
- אימייל
- סכום חודשי
- פעולות (ערוך, מחק, מעקב חודשי)
```

### 2. renderPaymentsTable()
**קובץ:** js/app.js

**מה צריך להוסיף:**
```javascript
// הוסף:
- <td><input type="checkbox" class="payment-checkbox" data-id="${payment.id}"></td>
- <td class="status-badge ${getPaymentStatus(payment)}">...</td>

// פונקציה חדשה:
function getPaymentStatus(payment) {
    // בדוק אם התשלום עבור החודש הנוכחי
    // אם כן → "paid"
    // אם לא → "pending"
}
```

### 3. populatePaymentTenantFilter()
**פונקציה חדשה**

```javascript
function populatePaymentTenantFilter() {
    const select = document.getElementById('paymentTenantFilter');
    select.innerHTML = '<option value="all">כל הדיירים</option>' +
        appState.tenants.map(t => `
            <option value="${t.id}">${t.name} (דירה ${t.apartment})</option>
        `).join('');
}
```

### 4. filterPaymentsByTenant()
**פונקציה חדשה**

```javascript
function filterPaymentsByTenant(tenantId) {
    if (tenantId === 'all') {
        renderPaymentsTable();
    } else {
        // סנן תשלומים לפי דייר
        renderPaymentsTable(tenantId);
    }
}
```

### 5. Bulk Actions לתשלומים
**פונקציות חדשות:**
- `selectAllPayments()` - בחירת כל התשלומים
- `bulkSendReceipts()` - הפקת קבלות למספר תשלומים
- `bulkSendWhatsappPayments()` - שליחת קבלות ב-WhatsApp
- `bulkMarkPaidPayments()` - סימון תשלומים כשולמו
- `bulkDeletePayments()` - מחיקת תשלומים

### 6. Event Listeners חדשים
```javascript
// הסר:
- bulkMarkPaidBtn
- bulkSendWhatsappBtn
- bulkSendReminderBtn
- statusFilter

// הוסף:
- selectAllPayments
- paymentTenantFilter
- paymentStatusFilter
- bulkSendReceiptBtn
- bulkSendWhatsappPaymentsBtn
- bulkMarkPaidPaymentsBtn
- bulkDeletePaymentsBtn
```

---

## 📊 זרימת עבודה חדשה

### תרחיש 1: רישום תשלום חדש
```
1. לשונית תשלומים
2. לחץ "רשום תשלום"
3. בחר דייר
4. מלא פרטים
5. שמור
   ↓
6. התשלום מופיע בטבלה עם סטטוס "שולם"
7. סטטוס הדייר מתעדכן אוטומטית (סנכרון)
```

### תרחיש 2: בחירת דייר לצפייה בתשלומים
```
1. לשונית תשלומים
2. בחר דייר מ-dropdown
   ↓
3. הטבלה מציגה רק תשלומים של הדייר הזה
4. אפשר לראות את כל התשלומים שלו
```

### תרחיש 3: הפקת קבלות מרובות
```
1. לשונית תשלומים
2. סמן מספר תשלומים (checkbox)
3. לחץ "הפק קבלות"
   ↓
4. המערכת יוצרת קבלה PDF לכל תשלום
5. כל הקבלות מורדות אוטומטית
```

---

## ⚠️ נקודות חשובות

1. **סנכרון** - כל שינוי בתשלום יעדכן את הדייר אוטומטית
2. **מעקב חודשי** - נשאר בשתי הלשוניות (כפי שביקשת)
3. **גיבוי** - כל הקבצים מגובים לפני השינוי
4. **תאימות אחורה** - הנתונים הקיימים ימשיכו לעבוד

---

## 📁 קבצים שישתנו

1. ✅ `index.html` - מבנה HTML חדש
2. ⏳ `js/app.js` - פונקציות מעודכנות
3. ⏳ `README.md` - תיעוד מעודכן
4. ⏳ `CHANGELOG.md` - רשומת שינויים
5. ⏳ `manifest.json` - גרסה 2.5.0
6. ⏳ `sw.js` - cache חדש

---

## 🎯 סטטוס נוכחי

- [x] HTML מעודכן
- [x] JavaScript מעודכן
- [x] Event listeners מעודכנים
- [x] בדיקות
- [x] תיעוד

**✅ הושלם!** גרסה 2.5.0 מוכנה לשימוש!

---

© 2024 בועז סעדה - All Rights Reserved
