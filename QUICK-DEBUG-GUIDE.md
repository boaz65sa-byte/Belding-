# ⚡ מדריך דיבאג מהיר - 2 דקות

## 🎯 בעיה: "אין תשלום רשום" ב-WhatsApp

### ✅ פתרון מהיר (3 צעדים):

---

## 1️⃣ פתח קונסולה
```
לחץ: F12
או: Ctrl + Shift + I
או: לחיצה ימנית → Inspect
```
👉 לך לטאב **"Console"**

---

## 2️⃣ רשום תשלום + צור קבלה

### מה לחפש בקונסולה:

#### ✅ אם הכל תקין:
```
💾 Set currentPaymentForReceipt in savePayment: ...
✅ User confirmed receipt generation
🧾 generateReceipt completed
💾 Saved to sessionStorage: ...
```

#### ❌ אם יש בעיה:
```
❌ currentPaymentForReceipt is empty!
```

---

## 3️⃣ פתרון מיידי

### אם רואים ❌ שגיאה:

**העתק והדבק בקונסולה:**
```javascript
const lastPayment = appState.payments[appState.payments.length - 1];
const tenant = appState.tenants.find(t => t.id === lastPayment.tenantId);
appState.currentPaymentForReceipt = { tenant, payment: lastPayment };
console.log('✅ תוקן ידנית!');
```

**עכשיו נסה שוב לשלוח ב-WhatsApp!**

---

## 📸 אם זה לא עוזר

1. צלם screenshot של הקונסולה
2. שלח לבועז סעדה
3. כלול: מה עשית + מה ראית

---

## 💡 טיפ

**תמיד השאר את הקונסולה פתוחה** כשעובד עם קבלות!

---

**זהו! 2 דקות וזה פתור.** ⚡

למדריך מפורט: `WHATSAPP-DEBUG.md`
